import { randomBytes } from "node:crypto";
import { ConflictException, HttpException, HttpStatus, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, type PaymentOrderStatus } from "@hellocarcar/db";
import type {
  CreateExchangeRateInput,
  CreatePaymentDestinationInput,
  CreatePaymentOrderInput,
  RequestRefundInput,
  ReviewPaymentOrderInput,
  ReviewRefundInput,
  SessionUser,
  UpdatePaymentDestinationInput,
  UpdateSubscriptionInput
} from "@hellocarcar/contracts";
import { PrismaService } from "../database/prisma.service";
import { MarketAccessService } from "../markets/market-access.service";
import { ObjectStorageService } from "../storage/object-storage.service";

const planPrices = { MONTHLY: new Prisma.Decimal("99.90"), ANNUAL: new Prisma.Decimal("899.90") } as const;

function subscriptionEnd(start: Date, interval: "MONTHLY" | "ANNUAL") {
  const result = new Date(start);
  if (interval === "MONTHLY") result.setUTCMonth(result.getUTCMonth() + 1);
  else result.setUTCFullYear(result.getUTCFullYear() + 1);
  return result;
}

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(MarketAccessService) private readonly marketAccess: MarketAccessService,
    @Inject(ObjectStorageService) private readonly storage: ObjectStorageService
  ) {}

  listDestinations() {
    return this.prisma.paymentDestination.findMany({ where: { isActive: true }, orderBy: [{ bankName: "asc" }, { label: "asc" }] });
  }

  listAdminDestinations() {
    return this.prisma.paymentDestination.findMany({ orderBy: [{ isActive: "desc" }, { bankName: "asc" }, { label: "asc" }] });
  }

  listExchangeRates() {
    return this.prisma.exchangeRateSnapshot.findMany({ include: { createdBy: { select: { id: true, email: true, displayName: true } } }, orderBy: { validFrom: "desc" }, take: 200 });
  }

  listRefunds() {
    return this.prisma.refundRecord.findMany({
      include: { paymentOrder: { include: { organization: true } }, requestedBy: true, approvedBy: true },
      orderBy: { createdAt: "desc" },
      take: 200
    });
  }

  listSubscriptions() {
    return this.prisma.subscription.findMany({
      include: { organization: true, marketScopes: { include: { market: true } }, paymentOrder: true },
      orderBy: { createdAt: "desc" },
      take: 200
    });
  }

  async createOrder(user: SessionUser, input: CreatePaymentOrderInput) {
    const market = await this.marketAccess.getMarket(input.marketCode);
    const destination = await this.prisma.paymentDestination.findFirst({ where: { id: input.destinationId, isActive: true, currencies: { has: input.currency } } });
    if (!destination) throw new NotFoundException({ code: "PAYMENT_DESTINATION_NOT_FOUND", message: "The selected corporate payment destination is unavailable" });
    const now = new Date();
    const baseAmount = planPrices[input.plan];
    const exchangeRate = input.currency === "USD" ? null : await this.prisma.exchangeRateSnapshot.findFirst({
      where: { baseCurrency: "USD", quoteCurrency: input.currency, validFrom: { lte: now }, validUntil: { gt: now } },
      orderBy: { validFrom: "desc" }
    });
    if (input.currency !== "USD" && !exchangeRate) {
      throw new ConflictException({ code: "EXCHANGE_RATE_UNAVAILABLE", message: `A current USD/${input.currency} rate is required` });
    }
    const payableAmount = exchangeRate ? baseAmount.mul(exchangeRate.rate).toDecimalPlaces(2) : baseAmount;
    const publicReference = `HCC-${now.toISOString().slice(2, 10).replace(/-/g, "")}-${randomBytes(4).toString("hex").toUpperCase()}`;
    const order = await this.prisma.paymentOrder.create({
      data: {
        publicReference,
        organizationId: user.organizationId,
        createdById: user.id,
        marketId: market.id,
        destinationId: destination.id,
        exchangeRateId: exchangeRate?.id,
        planCode: input.plan,
        planInterval: input.plan,
        baseAmountUsd: baseAmount,
        payableAmount,
        currency: input.currency,
        expiresAt: new Date(now.getTime() + 24 * 60 * 60_000)
      },
      include: { destination: true, exchangeRate: true }
    });
    await this.prisma.auditLog.create({ data: { actorId: user.id, action: "PAYMENT_ORDER_CREATED", entityType: "PaymentOrder", entityId: order.id, marketCode: input.marketCode, metadata: { publicReference, plan: input.plan, currency: input.currency } } });
    return order;
  }

  listOrders(user: SessionUser) {
    return this.prisma.paymentOrder.findMany({
      where: { organizationId: user.organizationId },
      include: { destination: true, proofs: { where: { userHiddenAt: null }, orderBy: { createdAt: "desc" } }, refunds: true, subscription: true },
      orderBy: { createdAt: "desc" }
    });
  }

  async getOrder(user: SessionUser, id: string) {
    const order = await this.prisma.paymentOrder.findFirst({
      where: { id, organizationId: user.organizationId },
      include: { destination: true, exchangeRate: true, proofs: { where: { userHiddenAt: null }, orderBy: { createdAt: "desc" } }, refunds: true, subscription: true }
    });
    if (!order) throw new NotFoundException({ code: "PAYMENT_ORDER_NOT_FOUND", message: "Payment order not found" });
    return order;
  }

  async submitProof(user: SessionUser, id: string, file: Express.Multer.File) {
    const order = await this.getOrder(user, id);
    if (!["AWAITING_PAYMENT", "NEEDS_SUPPLEMENT", "PROOF_SUBMITTED"].includes(order.status)) {
      throw new ConflictException({ code: "PAYMENT_ORDER_LOCKED", message: "This payment order no longer accepts proof uploads" });
    }
    if (order.expiresAt <= new Date()) {
      await this.prisma.paymentOrder.update({ where: { id }, data: { status: "EXPIRED" } });
      throw new ConflictException({ code: "PAYMENT_ORDER_EXPIRED", message: "The 24-hour payment quote has expired" });
    }
    const stored = await this.storage.putPaymentProof(order.id, file);
    const externalRef = `proof:${stored.fileHash}`;
    const existing = await this.prisma.paymentProof.findUnique({ where: { provider_externalRef: { provider: "manual-bank", externalRef } } });
    if (existing) {
      if (existing.paymentOrderId === order.id) return existing;
      throw new ConflictException({ code: "PAYMENT_PROOF_DUPLICATE", message: "This payment proof was already submitted for another order" });
    }
    return this.prisma.$transaction(async (tx) => {
      const proof = await tx.paymentProof.create({ data: {
        paymentOrderId: order.id,
        provider: "manual-bank",
        externalRef,
        amount: order.payableAmount,
        currency: order.currency,
        status: "PENDING_REVIEW",
        objectKey: stored.objectKey,
        originalName: stored.originalName,
        mimeType: stored.mimeType,
        fileSize: stored.fileSize,
        fileHash: stored.fileHash,
        submittedById: user.id,
        submittedAt: new Date()
      } });
      await tx.paymentOrder.update({ where: { id: order.id }, data: { status: "PROOF_SUBMITTED" } });
      await tx.reviewTask.upsert({
        where: { dedupeKey: `payment:${order.id}` },
        create: { marketId: order.marketId, type: "PAYMENT", entityType: "PaymentOrder", entityId: order.id, reason: "BANK_TRANSFER_PROOF_SUBMITTED", dedupeKey: `payment:${order.id}` },
        update: { status: "OPEN", completedAt: null, completedById: null, resolution: null }
      });
      await tx.auditLog.create({ data: { actorId: user.id, action: "PAYMENT_PROOF_SUBMITTED", entityType: "PaymentOrder", entityId: order.id, metadata: { proofId: proof.id, fileHash: stored.fileHash } } });
      return proof;
    });
  }

  async proofDownload(user: SessionUser, orderId: string, proofId: string) {
    const proof = await this.prisma.paymentProof.findFirst({ where: { id: proofId, paymentOrderId: orderId, paymentOrder: { organizationId: user.organizationId } } });
    if (!proof?.objectKey) throw new NotFoundException({ code: "PAYMENT_PROOF_NOT_FOUND", message: "Payment proof not found" });
    return { url: await this.storage.createPrivateDownloadUrl(proof.objectKey), expiresInSeconds: 300 };
  }

  createDestination(user: SessionUser, input: CreatePaymentDestinationInput) {
    return this.prisma.$transaction(async (tx) => {
      const destination = await tx.paymentDestination.create({ data: input });
      await tx.auditLog.create({ data: { actorId: user.id, action: "PAYMENT_DESTINATION_CREATED", entityType: "PaymentDestination", entityId: destination.id, metadata: { bankName: destination.bankName, currencies: destination.currencies } } });
      return destination;
    });
  }

  updateDestination(user: SessionUser, id: string, input: UpdatePaymentDestinationInput) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.paymentDestination.findUnique({ where: { id } });
      if (!existing) throw new NotFoundException({ code: "PAYMENT_DESTINATION_NOT_FOUND", message: "Payment destination not found" });
      const destination = await tx.paymentDestination.update({ where: { id }, data: { isActive: input.isActive } });
      await tx.auditLog.create({ data: { actorId: user.id, action: input.isActive ? "PAYMENT_DESTINATION_ACTIVATED" : "PAYMENT_DESTINATION_DEACTIVATED", entityType: "PaymentDestination", entityId: id, metadata: { bankName: destination.bankName } } });
      return destination;
    });
  }

  createExchangeRate(user: SessionUser, input: CreateExchangeRateInput) {
    const validFrom = input.validFrom ? new Date(input.validFrom) : new Date();
    const validUntil = input.validUntil ? new Date(input.validUntil) : new Date(validFrom.getTime() + 24 * 60 * 60_000);
    if (validUntil <= validFrom) throw new ConflictException({ code: "INVALID_RATE_WINDOW", message: "Exchange rate expiry must be after its start" });
    return this.prisma.exchangeRateSnapshot.create({ data: { baseCurrency: "USD", quoteCurrency: input.quoteCurrency, rate: input.rate, validFrom, validUntil, createdById: user.id } });
  }

  listAdminOrders() {
    return this.prisma.paymentOrder.findMany({ include: { organization: true, createdBy: true, destination: true, proofs: true, refunds: true, subscription: true }, orderBy: { createdAt: "desc" }, take: 200 });
  }

  async adminProofDownload(orderId: string, proofId: string) {
    const proof = await this.prisma.paymentProof.findFirst({ where: { id: proofId, paymentOrderId: orderId } });
    if (!proof?.objectKey) throw new NotFoundException({ code: "PAYMENT_PROOF_NOT_FOUND", message: "Payment proof not found" });
    return { url: await this.storage.createPrivateDownloadUrl(proof.objectKey), expiresInSeconds: 300 };
  }

  async updateSubscription(user: SessionUser, id: string, input: UpdateSubscriptionInput) {
    const existing = await this.prisma.subscription.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException({ code: "SUBSCRIPTION_NOT_FOUND", message: "Subscription not found" });
    const endsAt = input.endsAt ? new Date(input.endsAt) : undefined;
    if (endsAt && existing.startsAt && endsAt <= existing.startsAt) {
      throw new ConflictException({ code: "INVALID_SUBSCRIPTION_END", message: "Subscription end must be after its start" });
    }
    return this.prisma.$transaction(async (tx) => {
      const subscription = await tx.subscription.update({ where: { id }, data: { status: input.status, endsAt } });
      await tx.auditLog.create({ data: { actorId: user.id, action: "SUBSCRIPTION_UPDATED", entityType: "Subscription", entityId: id, metadata: { status: input.status, endsAt: input.endsAt } } });
      return subscription;
    });
  }

  async reviewOrder(user: SessionUser, id: string, input: ReviewPaymentOrderInput) {
    const existing = await this.prisma.paymentOrder.findUnique({ where: { id }, include: { proofs: true, createdBy: { include: { telegramIdentity: true } } } });
    if (!existing) throw new NotFoundException({ code: "PAYMENT_ORDER_NOT_FOUND", message: "Payment order not found" });
    if (input.decision === "APPROVE" && existing.status === "PAID") return existing;
    if (input.decision === "APPROVE" && existing.proofs.length === 0) throw new ConflictException({ code: "PAYMENT_PROOF_REQUIRED", message: "A payment proof is required before approval" });
    const status: PaymentOrderStatus = input.decision === "APPROVE" ? "PAID" : input.decision === "REJECT" ? "REJECTED" : "NEEDS_SUPPLEMENT";
    return this.prisma.$transaction(async (tx) => {
      let subscriptionId = existing.subscriptionId;
      const now = new Date();
      if (input.decision === "APPROVE" && !subscriptionId) {
        const subscription = await tx.subscription.create({ data: {
          organizationId: existing.organizationId,
          status: "ACTIVE",
          startsAt: now,
          endsAt: subscriptionEnd(now, existing.planInterval),
          fullReportLimit: 1,
          marketScopes: { create: { marketId: existing.marketId } }
        } });
        subscriptionId = subscription.id;
        await tx.paymentProof.updateMany({ where: { paymentOrderId: existing.id }, data: { status: "PAID", subscriptionId, reviewedById: user.id, reviewedAt: now } });
      } else if (input.decision !== "APPROVE") {
        await tx.paymentProof.updateMany({ where: { paymentOrderId: existing.id }, data: { status: input.decision === "REJECT" ? "REJECTED" : "PENDING_REVIEW", reviewedById: user.id, reviewedAt: now } });
      }
      const order = await tx.paymentOrder.update({ where: { id }, data: {
        status,
        subscriptionId,
        paidAt: input.decision === "APPROVE" ? now : undefined,
        reviewedById: user.id,
        reviewedAt: now,
        reviewReason: input.reason
      }, include: { subscription: true, destination: true } });
      await tx.reviewTask.updateMany({ where: { entityType: "PaymentOrder", entityId: id, status: "OPEN" }, data: { status: "COMPLETED", completedById: user.id, completedAt: now, resolution: input.reason } });
      await tx.auditLog.create({ data: { actorId: user.id, action: `PAYMENT_${status}`, entityType: "PaymentOrder", entityId: id, metadata: { reason: input.reason } } });
      await tx.notification.upsert({
        where: { dedupeKey: `payment:${id}:${status}:email` },
        create: { userId: existing.createdById, channel: "EMAIL", type: `PAYMENT_${status}`, recipient: existing.createdBy.email, payload: { orderId: id, publicReference: existing.publicReference, status }, dedupeKey: `payment:${id}:${status}:email` },
        update: {}
      });
      if (existing.createdBy.telegramIdentity) {
        await tx.notification.upsert({
          where: { dedupeKey: `payment:${id}:${status}:telegram` },
          create: { userId: existing.createdById, channel: "TELEGRAM", type: `PAYMENT_${status}`, recipient: existing.createdBy.telegramIdentity.telegramUserId, payload: { orderId: id, publicReference: existing.publicReference, status }, dedupeKey: `payment:${id}:${status}:telegram` },
          update: {}
        });
      }
      return order;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async requestRefund(user: SessionUser, orderId: string, input: RequestRefundInput) {
    const order = await this.prisma.paymentOrder.findFirst({ where: { id: orderId, organizationId: user.organizationId }, include: { refunds: true } });
    if (!order || !["PAID", "PARTIALLY_REFUNDED"].includes(order.status)) throw new NotFoundException({ code: "REFUND_ORDER_NOT_FOUND", message: "A paid order is required" });
    const committed = order.refunds.filter((refund) => refund.status !== "REJECTED").reduce((sum, refund) => sum.add(refund.amount), new Prisma.Decimal(0));
    if (committed.add(input.amount).gt(order.payableAmount)) throw new ConflictException({ code: "REFUND_EXCEEDS_PAYMENT", message: "Refund total cannot exceed the net amount received" });
    return this.prisma.refundRecord.create({ data: { paymentOrderId: order.id, requestedById: user.id, amount: input.amount, currency: order.currency, reason: input.reason } });
  }

  async reviewRefund(user: SessionUser, refundId: string, input: ReviewRefundInput) {
    const refund = await this.prisma.refundRecord.findUnique({ where: { id: refundId }, include: { paymentOrder: { include: { refunds: true } } } });
    if (!refund) throw new NotFoundException({ code: "REFUND_NOT_FOUND", message: "Refund request not found" });
    if (input.decision === "COMPLETE" && !input.bankReference) throw new HttpException({ code: "REFUND_BANK_REFERENCE_REQUIRED", message: "A bank reference is required to complete a refund" }, HttpStatus.BAD_REQUEST);
    const status = input.decision === "APPROVE" ? "APPROVED" : input.decision === "REJECT" ? "REJECTED" : "COMPLETED";
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.refundRecord.update({ where: { id: refundId }, data: {
        status,
        approvedById: user.id,
        bankReference: input.bankReference,
        completedAt: status === "COMPLETED" ? new Date() : undefined,
        reason: input.reason ? `${refund.reason}\n${input.reason}` : refund.reason
      } });
      if (status === "COMPLETED") {
        const otherCompleted = refund.paymentOrder.refunds.filter((item) => item.id !== refund.id && item.status === "COMPLETED").reduce((sum, item) => sum.add(item.amount), new Prisma.Decimal(0));
        const total = otherCompleted.add(refund.amount);
        await tx.paymentOrder.update({ where: { id: refund.paymentOrderId }, data: { status: total.gte(refund.paymentOrder.payableAmount) ? "REFUNDED" : "PARTIALLY_REFUNDED" } });
      }
      await tx.auditLog.create({ data: { actorId: user.id, action: `REFUND_${status}`, entityType: "RefundRecord", entityId: refundId, metadata: { bankReference: input.bankReference } } });
      return updated;
    });
  }
}
