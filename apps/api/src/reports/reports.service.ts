import {
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { EntitlementKind, Prisma } from "@hellocarcar/db";
import type { CreateReportInput, ReviewReportInput, SessionUser } from "@hellocarcar/contracts";
import { PrismaService } from "../database/prisma.service";
import { MarketAccessService } from "../markets/market-access.service";
import { ObjectStorageService } from "../storage/object-storage.service";
import { ReportsQueueService } from "./reports-queue.service";

const monthKey = (date = new Date()) => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;

@Injectable()
export class ReportsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(MarketAccessService) private readonly marketAccess: MarketAccessService,
    @Inject(ObjectStorageService) private readonly storage: ObjectStorageService,
    @Inject(ReportsQueueService) private readonly queue: ReportsQueueService
  ) {}

  async create(user: SessionUser, input: CreateReportInput) {
    const market = await this.marketAccess.getMarket(input.marketCode);
    const now = new Date();
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        organizationId: user.organizationId,
        status: "ACTIVE",
        startsAt: { lte: now },
        endsAt: { gt: now },
        marketScopes: { some: { marketId: market.id } }
      },
      orderBy: { endsAt: "desc" }
    });
    const vip = Boolean(subscription);

    if (input.reportType === "EXPERT" && !vip) {
      throw new HttpException({ code: "VIP_REQUIRED", message: "An active subscription is required for expert reports" }, HttpStatus.PAYMENT_REQUIRED);
    }
    if (input.supplierId) {
      const supplier = await this.prisma.supplier.findFirst({
        where: {
          id: input.supplierId,
          reviewState: "VERIFIED",
          reviewedById: { not: null },
          capabilities: { some: { marketId: market.id, reviewState: "VERIFIED", reviewedById: { not: null } } }
        },
        select: { id: true }
      });
      if (!supplier) throw new NotFoundException({ code: "SUPPLIER_NOT_VERIFIED", message: "Only verified suppliers can be used in reports" });
    }

    const report = await this.prisma.$transaction(async (tx) => {
      if (!vip) {
        const usedPreview = await tx.entitlementUsage.count({
          where: { organizationId: user.organizationId, marketId: market.id, kind: EntitlementKind.FREE_REPORT_PREVIEW }
        });
        if (usedPreview >= 1) {
          throw new HttpException({ code: "VIP_REQUIRED", message: "The free masked report preview has already been used" }, HttpStatus.PAYMENT_REQUIRED);
        }
      }
      if (input.reportType === "EXPERT" && subscription) {
        const usedReports = await tx.entitlementUsage.count({
          where: {
            organizationId: user.organizationId,
            marketId: market.id,
            kind: EntitlementKind.VIP_FULL_REPORT,
            periodKey: monthKey(now)
          }
        });
        if (usedReports >= subscription.fullReportLimit) {
          throw new HttpException({ code: "REPORT_LIMIT_REACHED", message: "Monthly expert report allowance reached" }, HttpStatus.PAYMENT_REQUIRED);
        }
      }

      const created = await tx.reportRequest.create({
        data: {
          organizationId: user.organizationId,
          requesterId: user.id,
          marketId: market.id,
          vehicleModelId: input.vehicleModelId,
          supplierId: input.supplierId,
          locale: input.locale,
          scope: input.scope,
          reportType: input.reportType,
          status: input.reportType === "EXPERT"
            ? "FULL_PENDING_REVIEW"
            : vip ? "FULL_GENERATING" : "PREVIEW_GENERATING",
          isMasked: !vip
        }
      });
      if (!vip || input.reportType === "EXPERT") {
        await tx.entitlementUsage.create({
          data: {
            organizationId: user.organizationId,
            marketId: market.id,
            kind: vip ? EntitlementKind.VIP_FULL_REPORT : EntitlementKind.FREE_REPORT_PREVIEW,
            resourceId: created.id,
            periodKey: vip ? monthKey(now) : "lifetime"
          }
        });
      }
      if (input.reportType === "EXPERT") {
        await tx.reviewTask.create({
          data: {
            marketId: market.id,
            type: "REPORT",
            entityType: "ReportRequest",
            entityId: created.id,
            reason: "EXPERT_REPORT_REVIEW",
            dedupeKey: `report:${created.id}`
          }
        });
      }
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "REPORT_REQUESTED",
          entityType: "ReportRequest",
          entityId: created.id,
          marketCode: input.marketCode,
          metadata: { masked: !vip, reportType: input.reportType, automatic: input.reportType === "STANDARD" }
        }
      });
      return created;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    if (input.reportType === "STANDARD") await this.enqueueOrFail(report.id);
    return this.get(user, report.id);
  }

  async get(user: SessionUser, id: string) {
    const report = await this.prisma.reportRequest.findFirst({
      where: { id, organizationId: user.organizationId },
      include: {
        market: true,
        vehicleModel: true,
        supplier: { select: { id: true, displayName: true, legalName: true } },
        versions: { orderBy: { version: "desc" }, take: 1 },
        disclosures: true
      }
    });
    if (!report) throw new NotFoundException({ code: "REPORT_NOT_FOUND", message: "Report not found" });
    return report;
  }

  list(user: SessionUser) {
    return this.prisma.reportRequest.findMany({
      where: { organizationId: user.organizationId },
      include: {
        market: { select: { code: true } },
        vehicleModel: { select: { id: true, make: true, name: true } },
        supplier: { select: { id: true, displayName: true } },
        versions: { orderBy: { version: "desc" }, take: 1 }
      },
      orderBy: { createdAt: "desc" },
      take: 100
    });
  }

  async download(user: SessionUser, id: string) {
    const report = await this.prisma.reportRequest.findFirst({
      where: { id, organizationId: user.organizationId, status: { in: ["PREVIEW_READY", "REPORT_READY"] } },
      include: { versions: { where: { pdfObjectKey: { not: null } }, orderBy: { version: "desc" }, take: 1 } }
    });
    if (!report) throw new NotFoundException({ code: "REPORT_PDF_NOT_READY", message: "Report PDF is not ready" });
    const version = report.versions[0];
    if (!version?.pdfObjectKey) throw new NotFoundException({ code: "REPORT_PDF_NOT_READY", message: "Report PDF is not ready" });
    return {
      reportId: report.id,
      version: version.version,
      masked: version.masked,
      url: await this.storage.createPrivateDownloadUrl(version.pdfObjectKey),
      expiresInSeconds: 300
    };
  }

  async getForReview(user: SessionUser, id: string) {
    const report = await this.prisma.reportRequest.findUnique({
      where: { id },
      include: {
        market: { select: { code: true, name: true } },
        organization: { select: { id: true, name: true } },
        requester: { select: { id: true, email: true, displayName: true } },
        vehicleModel: { select: { id: true, make: true, name: true, modelYear: true } },
        supplier: { select: { id: true, displayName: true, legalName: true } },
        versions: { orderBy: { version: "desc" } },
        reviews: {
          include: { reviewer: { select: { id: true, email: true, displayName: true } } },
          orderBy: { createdAt: "desc" }
        }
      }
    });
    if (!report) throw new NotFoundException({ code: "REPORT_NOT_FOUND", message: "Report not found" });
    if (user.role !== "ADMIN" && !user.marketScopes.includes(report.market.code as "DZ" | "IR")) {
      throw new ForbiddenException({ code: "MARKET_ASSIGNMENT_REQUIRED", message: "This reviewer is not assigned to the report market" });
    }
    const reviewTask = await this.prisma.reviewTask.findFirst({
      where: { entityType: "ReportRequest", entityId: report.id },
      include: {
        assignedTo: { select: { id: true, email: true, displayName: true } },
        completedBy: { select: { id: true, email: true, displayName: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    return { ...report, reviewTask };
  }

  async review(user: SessionUser, id: string, input: ReviewReportInput) {
    const report = await this.prisma.reportRequest.findUnique({ where: { id }, include: { market: true } });
    if (!report || report.reportType !== "EXPERT") {
      throw new NotFoundException({ code: "EXPERT_REPORT_NOT_FOUND", message: "Expert report not found" });
    }
    if (user.role !== "ADMIN" && !user.marketScopes.includes(report.market.code as "DZ" | "IR")) {
      throw new ForbiddenException({ code: "MARKET_ASSIGNMENT_REQUIRED", message: "This reviewer is not assigned to the report market" });
    }
    if (report.status !== "FULL_PENDING_REVIEW") {
      throw new ConflictException({ code: "REPORT_REVIEW_CLOSED", message: "This report is no longer awaiting review" });
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.reportReview.create({
        data: { reportRequestId: id, reviewerId: user.id, state: input.decision === "APPROVE" ? "VERIFIED" : "REJECTED", notes: input.notes }
      });
      const next = await tx.reportRequest.update({
        where: { id },
        data: { status: input.decision === "APPROVE" ? "FULL_GENERATING" : "CANCELLED" }
      });
      await tx.reviewTask.updateMany({
        where: { entityType: "ReportRequest", entityId: id, status: "OPEN" },
        data: { status: "COMPLETED", completedById: user.id, completedAt: new Date(), resolution: input.notes }
      });
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: input.decision === "APPROVE" ? "EXPERT_REPORT_APPROVED" : "EXPERT_REPORT_REJECTED",
          entityType: "ReportRequest",
          entityId: id,
          marketCode: report.market.code,
          metadata: { notes: input.notes }
        }
      });
      return next;
    });
    if (input.decision === "APPROVE") await this.enqueueOrFail(id);
    return updated;
  }

  private async enqueueOrFail(reportRequestId: string) {
    try {
      await this.queue.enqueue(reportRequestId);
    } catch (error) {
      await this.prisma.$transaction([
        this.prisma.reportRequest.update({ where: { id: reportRequestId }, data: { status: "GENERATION_FAILED" } }),
        this.prisma.auditLog.create({
          data: {
            action: "REPORT_QUEUE_FAILED",
            entityType: "ReportRequest",
            entityId: reportRequestId,
            metadata: { error: error instanceof Error ? error.message : "Unknown queue error" }
          }
        })
      ]);
      throw new HttpException({ code: "REPORT_QUEUE_UNAVAILABLE", message: "Report generation is temporarily unavailable" }, HttpStatus.SERVICE_UNAVAILABLE);
    }
  }
}
