import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { createHash } from "node:crypto";
import { reviewStateValues } from "@hellocarcar/contracts";
import type {
  CreateEligibilityInput,
  CreateEvidenceInput,
  CreatePolicyInput,
  CreatePolicyNewsInput,
  CreatePriceObservationInput,
  CreateSupplierCapabilityInput,
  CreateSupplierInput,
  ReviewState,
  SessionUser,
  TrustedDataCreateInput,
  TrustedDataListQuery,
  TrustedDataResource,
  TrustedDataTransitionInput,
  TrustedDataUpdateInput,
  UpdateEligibilityInput,
  UpdateEvidenceInput,
  UpdatePolicyInput,
  UpdatePolicyNewsInput,
  UpdatePriceObservationInput,
  UpdateSupplierCapabilityInput,
  UpdateSupplierInput
} from "@hellocarcar/contracts";
import { Prisma } from "@hellocarcar/db";
import { decodeLedgerCursor, toCursorPage } from "../common/ledger-pagination";
import { PrismaService } from "../database/prisma.service";
import { MarketAccessService } from "../markets/market-access.service";

const transitions: Record<ReviewState, ReviewState[]> = {
  DRAFT: ["PENDING_REVIEW"],
  PENDING_REVIEW: ["VERIFIED", "REJECTED"],
  VERIFIED: ["EXPIRED"],
  REJECTED: ["DRAFT"],
  EXPIRED: ["DRAFT"],
  NEEDS_LOCAL_CONFIRMATION: ["DRAFT", "PENDING_REVIEW"]
};

type EvidenceBackedRecord = {
  marketId: string;
  reviewState: ReviewState;
  evidenceLinks: Array<{
    evidence: {
      marketId: string | null;
      reviewState: ReviewState;
      validUntil: Date | null;
    };
  }>;
};

type ReviewStateGroup = { reviewState: ReviewState; _count: { _all: number } };

const reviewStateFilterMeta = (groups: ReviewStateGroup[]) => reviewStateValues.map((value) => ({
  value,
  count: groups.find((group) => group.reviewState === value)?._count._all ?? 0
}));

@Injectable()
export class TrustedDataService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(MarketAccessService) private readonly marketAccess: MarketAccessService
  ) {}

  async listCurrentPolicies(marketCode: "DZ" | "IR") {
    const market = await this.marketAccess.getMarket(marketCode);
    const now = new Date();
    return this.prisma.countryPolicy.findMany({
      where: {
        marketId: market.id,
        reviewState: "VERIFIED",
        reviewedById: { not: null },
        effectiveAt: { lte: now },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        evidenceLinks: {
          some: {
            evidence: {
              reviewState: "VERIFIED",
              reviewedById: { not: null },
              OR: [{ validUntil: null }, { validUntil: { gt: now } }]
            }
          }
        }
      },
      select: {
        id: true,
        category: true,
        title: true,
        summary: true,
        plainExplanation: true,
        steps: true,
        requiredDocuments: true,
        feesNote: true,
        effectiveAt: true,
        expiresAt: true,
        reviewedAt: true,
        updatedAt: true
      },
      orderBy: [{ effectiveAt: "desc" }, { updatedAt: "desc" }]
    });
  }

  async listCurrentPolicyNews(marketCode: "DZ" | "IR") {
    const market = await this.marketAccess.getMarket(marketCode);
    const now = new Date();
    return this.prisma.policyNewsItem.findMany({
      where: { marketId: market.id, reviewState: "VERIFIED", reviewedById: { not: null }, publishedAt: { not: null },
        OR: [{ effectiveAt: null }, { effectiveAt: { lte: now } }],
        evidenceLinks: { some: { evidence: { reviewState: "VERIFIED", reviewedById: { not: null }, OR: [{ validUntil: null }, { validUntil: { gt: now } }] } } }
      },
      select: { id: true, category: true, title: true, summary: true, impactSummary: true, originalLanguage: true, sourceUrl: true, observedAt: true, publishedAt: true, effectiveAt: true, updatedAt: true },
      orderBy: [{ publishedAt: "desc" }, { observedAt: "desc" }], take: 30
    });
  }

  private async requireMarket(user: SessionUser, marketCode: string) {
    const market = await this.marketAccess.getMarket(marketCode);
    if (user.role !== "ADMIN" && !user.marketScopes.includes(market.code as "DZ" | "IR")) {
      throw new ForbiddenException({ code: "MARKET_ASSIGNMENT_REQUIRED", message: "This analyst is not assigned to the requested market" });
    }
    return market;
  }

  async options(user: SessionUser, marketCode: string) {
    const market = await this.requireMarket(user, marketCode);
    const [vehicleModels, evidence, suppliers, memberships] = await Promise.all([
      this.prisma.vehicleModel.findMany({
        select: { id: true, make: true, name: true, modelYear: true },
        orderBy: [{ make: "asc" }, { name: "asc" }]
      }),
      this.prisma.evidence.findMany({
        where: { marketId: market.id },
        select: { id: true, title: true, reviewState: true, validUntil: true },
        orderBy: { updatedAt: "desc" }
      }),
      this.prisma.supplier.findMany({
        select: { id: true, legalName: true, displayName: true, reviewState: true },
        orderBy: { displayName: "asc" }
      }),
      this.prisma.membership.findMany({
        where: {
          organizationId: user.organizationId,
          role: { in: ["ANALYST", "ADMIN"] },
          OR: [{ role: "ADMIN" }, { marketScopes: { some: { marketId: market.id } } }]
        },
        select: { role: true, user: { select: { id: true, email: true, displayName: true } } },
        orderBy: { createdAt: "asc" }
      })
    ]);
    return {
      market: { id: market.id, code: market.code, name: market.name, status: market.status },
      vehicleModels,
      evidence,
      suppliers,
      assignees: memberships.map(({ role, user: assignee }) => ({ ...assignee, role }))
    };
  }

  async list(user: SessionUser, resource: TrustedDataResource, input: TrustedDataListQuery) {
    const market = await this.requireMarket(user, input.marketCode);
    const cursorScope = JSON.stringify([resource, market.id, input.reviewState, input.query ?? ""]);
    const cursorId = decodeLedgerCursor(input.cursor, cursorScope);
    const cursor: { cursor?: { id: string }; skip?: number } = cursorId ? { cursor: { id: cursorId }, skip: 1 } : {};
    const reviewState = input.reviewState === "ALL" ? {} : { reviewState: input.reviewState };
    switch (resource) {
      case "evidence": {
        const baseWhere: Prisma.EvidenceWhereInput = {
          marketId: market.id,
          ...(input.query ? { OR: [
            { title: { contains: input.query, mode: "insensitive" } },
            { kind: { contains: input.query, mode: "insensitive" } },
            { sourceRef: { contains: input.query, mode: "insensitive" } }
          ] } : {})
        };
        const where: Prisma.EvidenceWhereInput = { ...baseWhere, ...reviewState };
        const [rows, totalCount, groups] = await Promise.all([
          this.prisma.evidence.findMany({ where, include: { reviewedBy: { select: { id: true, email: true, displayName: true } } }, orderBy: [{ updatedAt: "desc" }, { id: "desc" }], take: input.limit + 1, ...cursor }),
          this.prisma.evidence.count({ where }),
          this.prisma.evidence.groupBy({ by: ["reviewState"], where: baseWhere, _count: { _all: true } })
        ]);
        return toCursorPage(rows, input.limit, cursorScope, { totalCount, reviewStates: reviewStateFilterMeta(groups) });
      }
      case "policies": {
        const baseWhere: Prisma.CountryPolicyWhereInput = {
          marketId: market.id,
          ...(input.query ? { OR: [
            { title: { contains: input.query, mode: "insensitive" } },
            { category: { contains: input.query, mode: "insensitive" } },
            { summary: { contains: input.query, mode: "insensitive" } }
          ] } : {})
        };
        const where: Prisma.CountryPolicyWhereInput = { ...baseWhere, ...reviewState };
        const [rows, totalCount, groups] = await Promise.all([
          this.prisma.countryPolicy.findMany({ where, include: { reviewedBy: { select: { id: true, email: true, displayName: true } }, evidenceLinks: { include: { evidence: true } } }, orderBy: [{ updatedAt: "desc" }, { id: "desc" }], take: input.limit + 1, ...cursor }),
          this.prisma.countryPolicy.count({ where }),
          this.prisma.countryPolicy.groupBy({ by: ["reviewState"], where: baseWhere, _count: { _all: true } })
        ]);
        return toCursorPage(rows, input.limit, cursorScope, { totalCount, reviewStates: reviewStateFilterMeta(groups) });
      }
      case "policy-news": {
        const baseWhere: Prisma.PolicyNewsItemWhereInput = { marketId: market.id, ...(input.query ? { OR: [
          { title: { contains: input.query, mode: "insensitive" } },
          { category: { contains: input.query, mode: "insensitive" } },
          { summary: { contains: input.query, mode: "insensitive" } },
          { impactSummary: { contains: input.query, mode: "insensitive" } }
        ] } : {}) };
        const where: Prisma.PolicyNewsItemWhereInput = { ...baseWhere, ...reviewState };
        const [rows, totalCount, groups] = await Promise.all([
          this.prisma.policyNewsItem.findMany({ where, include: { reviewedBy: { select: { id: true, email: true, displayName: true } }, evidenceLinks: { include: { evidence: true } } }, orderBy: [{ updatedAt: "desc" }, { id: "desc" }], take: input.limit + 1, ...cursor }),
          this.prisma.policyNewsItem.count({ where }), this.prisma.policyNewsItem.groupBy({ by: ["reviewState"], where: baseWhere, _count: { _all: true } })
        ]);
        return toCursorPage(rows, input.limit, cursorScope, { totalCount, reviewStates: reviewStateFilterMeta(groups) });
      }
      case "eligibility": {
        const baseWhere: Prisma.VehicleMarketEligibilityWhereInput = {
          marketId: market.id,
          ...(input.query ? { vehicleModel: { is: { OR: [
            { make: { contains: input.query, mode: "insensitive" } },
            { name: { contains: input.query, mode: "insensitive" } }
          ] } } } : {})
        };
        const where: Prisma.VehicleMarketEligibilityWhereInput = { ...baseWhere, ...reviewState };
        const [rows, totalCount, groups] = await Promise.all([
          this.prisma.vehicleMarketEligibility.findMany({ where, include: { vehicleModel: true, reviewedBy: { select: { id: true, email: true, displayName: true } }, evidenceLinks: { include: { evidence: true } } }, orderBy: [{ vehicleModel: { make: "asc" } }, { id: "asc" }], take: input.limit + 1, ...cursor }),
          this.prisma.vehicleMarketEligibility.count({ where }),
          this.prisma.vehicleMarketEligibility.groupBy({ by: ["reviewState"], where: baseWhere, _count: { _all: true } })
        ]);
        return toCursorPage(rows, input.limit, cursorScope, { totalCount, reviewStates: reviewStateFilterMeta(groups) });
      }
      case "suppliers": {
        const baseWhere: Prisma.SupplierWhereInput = input.query ? { OR: [
          { displayName: { contains: input.query, mode: "insensitive" } },
          { legalName: { contains: input.query, mode: "insensitive" } },
          { countryCode: { contains: input.query, mode: "insensitive" } }
        ] } : {};
        const where: Prisma.SupplierWhereInput = { ...baseWhere, ...reviewState };
        const [rows, totalCount, groups] = await Promise.all([
          this.prisma.supplier.findMany({ where, include: { reviewedBy: { select: { id: true, email: true, displayName: true } }, capabilities: { where: { marketId: market.id } } }, orderBy: [{ displayName: "asc" }, { id: "asc" }], take: input.limit + 1, ...cursor }),
          this.prisma.supplier.count({ where }),
          this.prisma.supplier.groupBy({ by: ["reviewState"], where: baseWhere, _count: { _all: true } })
        ]);
        return toCursorPage(rows, input.limit, cursorScope, { totalCount, reviewStates: reviewStateFilterMeta(groups) });
      }
      case "supplier-capabilities": {
        const baseWhere: Prisma.SupplierMarketCapabilityWhereInput = {
          marketId: market.id,
          ...(input.query ? { supplier: { is: { OR: [
            { displayName: { contains: input.query, mode: "insensitive" } },
            { legalName: { contains: input.query, mode: "insensitive" } }
          ] } } } : {})
        };
        const where: Prisma.SupplierMarketCapabilityWhereInput = { ...baseWhere, ...reviewState };
        const [rows, totalCount, groups] = await Promise.all([
          this.prisma.supplierMarketCapability.findMany({ where, include: { supplier: true, reviewedBy: { select: { id: true, email: true, displayName: true } }, evidenceLinks: { include: { evidence: true } } }, orderBy: [{ supplier: { displayName: "asc" } }, { id: "asc" }], take: input.limit + 1, ...cursor }),
          this.prisma.supplierMarketCapability.count({ where }),
          this.prisma.supplierMarketCapability.groupBy({ by: ["reviewState"], where: baseWhere, _count: { _all: true } })
        ]);
        return toCursorPage(rows, input.limit, cursorScope, { totalCount, reviewStates: reviewStateFilterMeta(groups) });
      }
      case "price-observations": {
        const baseWhere: Prisma.PriceObservationWhereInput = {
          marketId: market.id,
          ...(input.query ? { OR: [
            { sourceRef: { contains: input.query, mode: "insensitive" } },
            { currency: { contains: input.query, mode: "insensitive" } },
            { incoterm: { contains: input.query, mode: "insensitive" } },
            { vehicleModel: { is: { OR: [
              { make: { contains: input.query, mode: "insensitive" } },
              { name: { contains: input.query, mode: "insensitive" } }
            ] } } }
          ] } : {})
        };
        const where: Prisma.PriceObservationWhereInput = { ...baseWhere, ...reviewState };
        const [rows, totalCount, groups] = await Promise.all([
          this.prisma.priceObservation.findMany({ where, include: { vehicleModel: true, reviewedBy: { select: { id: true, email: true, displayName: true } }, evidenceLinks: { include: { evidence: true } } }, orderBy: [{ observedAt: "desc" }, { id: "desc" }], take: input.limit + 1, ...cursor }),
          this.prisma.priceObservation.count({ where }),
          this.prisma.priceObservation.groupBy({ by: ["reviewState"], where: baseWhere, _count: { _all: true } })
        ]);
        return toCursorPage(rows, input.limit, cursorScope, { totalCount, reviewStates: reviewStateFilterMeta(groups) });
      }
    }
  }

  async create(user: SessionUser, resource: TrustedDataResource, rawInput: TrustedDataCreateInput) {
    const marketCode = rawInput.marketCode;
    const market = await this.requireMarket(user, marketCode);
    return this.prisma.$transaction(async (tx) => {
      let record: { id: string };
      switch (resource) {
        case "evidence": {
          const input = rawInput as CreateEvidenceInput;
          const conflict = await tx.evidence.findFirst({
            where: { marketId: market.id, sourceSystem: input.sourceSystem, sourceRef: input.sourceRef, NOT: { contentHash: input.contentHash } }
          });
          record = await tx.evidence.create({
            data: {
              marketId: market.id,
              scope: "MARKET",
              kind: input.kind,
              title: input.title,
              sourceSystem: input.sourceSystem,
              sourceRef: input.sourceRef,
              sourceUrl: input.sourceUrl,
              observedAt: new Date(input.observedAt),
              validUntil: input.validUntil ? new Date(input.validUntil) : null,
              reviewState: conflict ? "NEEDS_LOCAL_CONFIRMATION" : "DRAFT",
              contentHash: input.contentHash,
              metadata: input.metadata as Prisma.InputJsonValue | undefined
            }
          });
          if (conflict) {
            await tx.reviewTask.create({
              data: { marketId: market.id, type: "EVIDENCE", entityType: "Evidence", entityId: record.id, reason: `Source content conflicts with evidence ${conflict.id}` }
            });
          }
          break;
        }
        case "policies": {
          const input = rawInput as CreatePolicyInput;
          await this.ensureEvidence(tx, market.id, input.evidenceIds);
          record = await tx.countryPolicy.create({ data: {
            marketId: market.id,
            category: input.category,
            title: input.title,
            summary: input.summary,
            plainExplanation: input.plainExplanation,
            steps: input.steps as Prisma.InputJsonValue | undefined,
            requiredDocuments: input.requiredDocuments as Prisma.InputJsonValue | undefined,
            feesNote: input.feesNote,
            effectiveAt: new Date(input.effectiveAt),
            expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
            sourceUrl: input.sourceUrl,
            reviewState: "DRAFT",
            evidenceLinks: { create: input.evidenceIds.map((evidenceId) => ({ evidenceId })) }
          } });
          break;
        }
        case "policy-news": {
          const input = rawInput as CreatePolicyNewsInput;
          await this.ensureEvidence(tx, market.id, input.evidenceIds);
          const contentHash = createHash("sha256").update(JSON.stringify({
            category: input.category, title: input.title, summary: input.summary, impactSummary: input.impactSummary,
            originalLanguage: input.originalLanguage ?? null, sourceUrl: input.sourceUrl, sourceSystem: input.sourceSystem,
            sourceRef: input.sourceRef, observedAt: input.observedAt, publishedAt: input.publishedAt ?? null, effectiveAt: input.effectiveAt ?? null,
            relatedPolicyId: input.relatedPolicyId ?? null
          })).digest("hex");
          record = await tx.policyNewsItem.create({ data: {
            marketId: market.id,
            category: input.category,
            title: input.title,
            summary: input.summary,
            impactSummary: input.impactSummary,
            originalLanguage: input.originalLanguage,
            sourceUrl: input.sourceUrl,
            sourceSystem: input.sourceSystem,
            sourceRef: input.sourceRef,
            observedAt: new Date(input.observedAt),
            publishedAt: input.publishedAt ? new Date(input.publishedAt) : null,
            effectiveAt: input.effectiveAt ? new Date(input.effectiveAt) : null,
            relatedPolicyId: input.relatedPolicyId,
            contentHash,
            reviewState: "DRAFT",
            evidenceLinks: { create: input.evidenceIds.map((evidenceId) => ({ evidenceId })) }
          } });
          break;
        }
        case "eligibility": {
          const input = rawInput as CreateEligibilityInput;
          await this.ensureEvidence(tx, market.id, input.evidenceIds);
          record = await tx.vehicleMarketEligibility.create({ data: {
            marketId: market.id,
            vehicleModelId: input.vehicleModelId,
            eligible: input.eligible,
            restrictions: input.restrictions as Prisma.InputJsonValue | undefined,
            reviewState: "DRAFT",
            evidenceLinks: { create: input.evidenceIds.map((evidenceId) => ({ evidenceId })) }
          } });
          break;
        }
        case "suppliers": {
          const input = rawInput as CreateSupplierInput;
          record = await tx.supplier.create({ data: {
            legalName: input.legalName,
            displayName: input.displayName,
            countryCode: input.countryCode,
            contactName: input.contactName,
            contactEmail: input.contactEmail,
            contactPhone: input.contactPhone,
            reviewState: "DRAFT"
          } });
          break;
        }
        case "supplier-capabilities": {
          const input = rawInput as CreateSupplierCapabilityInput;
          await this.ensureEvidence(tx, market.id, input.evidenceIds);
          record = await tx.supplierMarketCapability.create({ data: {
            marketId: market.id,
            supplierId: input.supplierId,
            score: input.score,
            dimensions: input.dimensions as Prisma.InputJsonValue | undefined,
            routes: input.routes as Prisma.InputJsonValue | undefined,
            reviewState: "DRAFT",
            evidenceLinks: { create: input.evidenceIds.map((evidenceId) => ({ evidenceId })) }
          } });
          break;
        }
        case "price-observations": {
          const input = rawInput as CreatePriceObservationInput;
          await this.ensureEvidence(tx, market.id, input.evidenceIds);
          record = await tx.priceObservation.create({ data: {
            marketId: market.id,
            vehicleModelId: input.vehicleModelId,
            amount: input.amount,
            currency: input.currency,
            incoterm: input.incoterm,
            observedAt: new Date(input.observedAt),
            validUntil: input.validUntil ? new Date(input.validUntil) : null,
            reviewState: "DRAFT",
            sourceSystem: input.sourceSystem,
            sourceRef: input.sourceRef,
            evidenceLinks: { create: input.evidenceIds.map((evidenceId) => ({ evidenceId })) }
          } });
          break;
        }
      }
      await tx.auditLog.create({ data: { actorId: user.id, action: "TRUSTED_DATA_CREATED", entityType: resource, entityId: record.id, marketCode } });
      return record;
    });
  }

  async update(user: SessionUser, resource: TrustedDataResource, id: string, marketCode: string, rawInput: TrustedDataUpdateInput) {
    const market = await this.requireMarket(user, marketCode);
    const current = await this.getTransitionRecord(resource, id, market.id);
    if (current.reviewState !== "DRAFT") {
      throw new BadRequestException({ code: "DRAFT_EDIT_ONLY", message: "Only draft trusted data can be edited" });
    }

    return this.prisma.$transaction(async (tx) => {
      let updated: { id: string };
      switch (resource) {
        case "evidence": {
          const input = rawInput as UpdateEvidenceInput;
          const existing = await tx.evidence.findFirst({ where: { id, marketId: market.id } });
          if (!existing) {
            throw new NotFoundException({ code: "TRUSTED_DATA_NOT_FOUND", message: "Trusted data record not found in this market" });
          }
          const sourceSystem = input.sourceSystem ?? existing.sourceSystem;
          const sourceRef = input.sourceRef ?? existing.sourceRef;
          const contentHash = input.contentHash ?? existing.contentHash;
          const conflict = await tx.evidence.findFirst({
            where: {
              id: { not: id },
              marketId: market.id,
              sourceSystem,
              sourceRef,
              NOT: { contentHash }
            },
            select: { id: true }
          });
          updated = await tx.evidence.update({ where: { id }, data: {
            ...(input.kind !== undefined ? { kind: input.kind } : {}),
            ...(input.title !== undefined ? { title: input.title } : {}),
            ...(input.sourceSystem !== undefined ? { sourceSystem: input.sourceSystem } : {}),
            ...(input.sourceRef !== undefined ? { sourceRef: input.sourceRef } : {}),
            ...(input.sourceUrl !== undefined ? { sourceUrl: input.sourceUrl } : {}),
            ...(input.observedAt !== undefined ? { observedAt: new Date(input.observedAt) } : {}),
            ...(input.validUntil !== undefined ? { validUntil: input.validUntil ? new Date(input.validUntil) : null } : {}),
            ...(input.contentHash !== undefined ? { contentHash: input.contentHash } : {}),
            ...(input.metadata !== undefined ? { metadata: input.metadata === null ? Prisma.JsonNull : input.metadata as Prisma.InputJsonValue } : {}),
            ...(conflict ? { reviewState: "NEEDS_LOCAL_CONFIRMATION" } : {})
          } });
          if (conflict) {
            await tx.reviewTask.create({
              data: {
                marketId: market.id,
                type: "EVIDENCE",
                entityType: "Evidence",
                entityId: id,
                reason: `Source content conflicts with evidence ${conflict.id}`
              }
            });
          }
          break;
        }
        case "policies": {
          const input = rawInput as UpdatePolicyInput;
          if (input.evidenceIds) await this.ensureEvidence(tx, market.id, input.evidenceIds);
          updated = await tx.countryPolicy.update({ where: { id }, data: {
            ...(input.category !== undefined ? { category: input.category } : {}),
            ...(input.title !== undefined ? { title: input.title } : {}),
            ...(input.summary !== undefined ? { summary: input.summary } : {}),
            ...(input.plainExplanation !== undefined ? { plainExplanation: input.plainExplanation } : {}),
            ...(input.steps !== undefined ? { steps: input.steps === null ? Prisma.JsonNull : input.steps as Prisma.InputJsonValue } : {}),
            ...(input.requiredDocuments !== undefined ? { requiredDocuments: input.requiredDocuments === null ? Prisma.JsonNull : input.requiredDocuments as Prisma.InputJsonValue } : {}),
            ...(input.feesNote !== undefined ? { feesNote: input.feesNote } : {}),
            ...(input.effectiveAt !== undefined ? { effectiveAt: new Date(input.effectiveAt) } : {}),
            ...(input.expiresAt !== undefined ? { expiresAt: input.expiresAt ? new Date(input.expiresAt) : null } : {}),
            ...(input.sourceUrl !== undefined ? { sourceUrl: input.sourceUrl } : {}),
            ...(input.evidenceIds ? { evidenceLinks: { deleteMany: {}, create: input.evidenceIds.map((evidenceId) => ({ evidenceId })) } } : {})
          } });
          break;
        }
        case "policy-news": {
          const input = rawInput as UpdatePolicyNewsInput;
          if (input.evidenceIds) await this.ensureEvidence(tx, market.id, input.evidenceIds);
          updated = await tx.policyNewsItem.update({ where: { id }, data: {
            ...(input.category !== undefined ? { category: input.category } : {}), ...(input.title !== undefined ? { title: input.title } : {}),
            ...(input.summary !== undefined ? { summary: input.summary } : {}), ...(input.impactSummary !== undefined ? { impactSummary: input.impactSummary } : {}),
            ...(input.originalLanguage !== undefined ? { originalLanguage: input.originalLanguage } : {}), ...(input.sourceUrl !== undefined ? { sourceUrl: input.sourceUrl } : {}),
            ...(input.sourceSystem !== undefined ? { sourceSystem: input.sourceSystem } : {}), ...(input.sourceRef !== undefined ? { sourceRef: input.sourceRef } : {}),
            ...(input.observedAt !== undefined ? { observedAt: new Date(input.observedAt) } : {}), ...(input.publishedAt !== undefined ? { publishedAt: input.publishedAt ? new Date(input.publishedAt) : null } : {}),
            ...(input.effectiveAt !== undefined ? { effectiveAt: input.effectiveAt ? new Date(input.effectiveAt) : null } : {}), ...(input.relatedPolicyId !== undefined ? { relatedPolicyId: input.relatedPolicyId } : {}),
            ...(input.evidenceIds ? { evidenceLinks: { deleteMany: {}, create: input.evidenceIds.map((evidenceId) => ({ evidenceId })) } } : {})
          } });
          break;
        }
        case "eligibility": {
          const input = rawInput as UpdateEligibilityInput;
          if (input.evidenceIds) await this.ensureEvidence(tx, market.id, input.evidenceIds);
          updated = await tx.vehicleMarketEligibility.update({ where: { id }, data: {
            ...(input.vehicleModelId !== undefined ? { vehicleModelId: input.vehicleModelId } : {}),
            ...(input.eligible !== undefined ? { eligible: input.eligible } : {}),
            ...(input.restrictions !== undefined ? { restrictions: input.restrictions === null ? Prisma.JsonNull : input.restrictions as Prisma.InputJsonValue } : {}),
            ...(input.evidenceIds ? { evidenceLinks: { deleteMany: {}, create: input.evidenceIds.map((evidenceId) => ({ evidenceId })) } } : {})
          } });
          break;
        }
        case "suppliers": {
          const input = rawInput as UpdateSupplierInput;
          updated = await tx.supplier.update({ where: { id }, data: {
            ...(input.legalName !== undefined ? { legalName: input.legalName } : {}),
            ...(input.displayName !== undefined ? { displayName: input.displayName } : {}),
            ...(input.countryCode !== undefined ? { countryCode: input.countryCode } : {}),
            ...(input.contactName !== undefined ? { contactName: input.contactName } : {}),
            ...(input.contactEmail !== undefined ? { contactEmail: input.contactEmail } : {}),
            ...(input.contactPhone !== undefined ? { contactPhone: input.contactPhone } : {})
          } });
          break;
        }
        case "supplier-capabilities": {
          const input = rawInput as UpdateSupplierCapabilityInput;
          if (input.evidenceIds) await this.ensureEvidence(tx, market.id, input.evidenceIds);
          updated = await tx.supplierMarketCapability.update({ where: { id }, data: {
            ...(input.supplierId !== undefined ? { supplierId: input.supplierId } : {}),
            ...(input.score !== undefined ? { score: input.score } : {}),
            ...(input.dimensions !== undefined ? { dimensions: input.dimensions === null ? Prisma.JsonNull : input.dimensions as Prisma.InputJsonValue } : {}),
            ...(input.routes !== undefined ? { routes: input.routes === null ? Prisma.JsonNull : input.routes as Prisma.InputJsonValue } : {}),
            ...(input.evidenceIds ? { evidenceLinks: { deleteMany: {}, create: input.evidenceIds.map((evidenceId) => ({ evidenceId })) } } : {})
          } });
          break;
        }
        case "price-observations": {
          const input = rawInput as UpdatePriceObservationInput;
          if (input.evidenceIds) await this.ensureEvidence(tx, market.id, input.evidenceIds);
          updated = await tx.priceObservation.update({ where: { id }, data: {
            ...(input.vehicleModelId !== undefined ? { vehicleModelId: input.vehicleModelId } : {}),
            ...(input.amount !== undefined ? { amount: input.amount } : {}),
            ...(input.currency !== undefined ? { currency: input.currency } : {}),
            ...(input.incoterm !== undefined ? { incoterm: input.incoterm } : {}),
            ...(input.observedAt !== undefined ? { observedAt: new Date(input.observedAt) } : {}),
            ...(input.validUntil !== undefined ? { validUntil: input.validUntil ? new Date(input.validUntil) : null } : {}),
            ...(input.sourceSystem !== undefined ? { sourceSystem: input.sourceSystem } : {}),
            ...(input.sourceRef !== undefined ? { sourceRef: input.sourceRef } : {}),
            ...(input.evidenceIds ? { evidenceLinks: { deleteMany: {}, create: input.evidenceIds.map((evidenceId) => ({ evidenceId })) } } : {})
          } });
          break;
        }
      }
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "TRUSTED_DATA_DRAFT_UPDATED",
          entityType: resource,
          entityId: id,
          marketCode,
          metadata: { changedFields: Object.keys(rawInput) }
        }
      });
      return updated;
    });
  }

  async transition(user: SessionUser, resource: TrustedDataResource, id: string, marketCode: string, input: TrustedDataTransitionInput) {
    const market = await this.requireMarket(user, marketCode);
    const record = await this.getTransitionRecord(resource, id, market.id);
    if (!transitions[record.reviewState].includes(input.to)) {
      throw new BadRequestException({ code: "INVALID_REVIEW_TRANSITION", message: `Cannot transition ${record.reviewState} to ${input.to}` });
    }
    if (user.role !== "ADMIN" && (input.to === "VERIFIED" || input.to === "REJECTED")) {
      throw new ForbiddenException({ code: "REVIEWER_REQUIRED", message: "Only an administrator reviewer can verify or reject trusted data" });
    }
    if (input.to === "VERIFIED") {
      this.ensureVerifiable(record);
      if (resource === "evidence") {
        const openConflict = await this.prisma.reviewTask.findFirst({ where: { entityType: "Evidence", entityId: id, status: "OPEN" } });
        if (openConflict) {
          throw new BadRequestException({ code: "EVIDENCE_CONFLICT_OPEN", message: "Resolve the open evidence conflict review task before verification" });
        }
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await this.updateState(tx, resource, id, input.to, user.id);
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "TRUSTED_DATA_STATE_CHANGED",
          entityType: resource,
          entityId: id,
          marketCode,
          metadata: { from: record.reviewState, to: input.to, reason: input.reason }
        }
      });
      if (input.to === "EXPIRED") {
        await tx.reviewTask.create({
          data: {
            marketId: market.id,
            type: resource === "policies" ? "POLICY" : resource === "policy-news" ? "POLICY_NEWS" : "EVIDENCE",
            entityType: resource,
            entityId: id,
            reason: input.reason
          }
        });
      }
      return updated;
    });
  }

  private async ensureEvidence(tx: Prisma.TransactionClient, marketId: string, evidenceIds: string[]) {
    const evidence = await tx.evidence.findMany({ where: { id: { in: evidenceIds }, OR: [{ marketId }, { marketId: null, scope: "GLOBAL" }] } });
    if (evidence.length !== new Set(evidenceIds).size) {
      throw new BadRequestException({ code: "EVIDENCE_SCOPE_MISMATCH", message: "Every linked evidence record must exist in the same market or be global" });
    }
  }

  private ensureVerifiable(record: EvidenceBackedRecord & { validUntil?: Date | null }) {
    const now = new Date();
    if (record.validUntil && record.validUntil <= now) {
      throw new BadRequestException({ code: "EVIDENCE_EXPIRED", message: "Expired evidence cannot be verified" });
    }
    if (!record.evidenceLinks.length) return;
    const invalid = record.evidenceLinks.some(({ evidence }) =>
      evidence.reviewState !== "VERIFIED" ||
      (evidence.marketId !== null && evidence.marketId !== record.marketId) ||
      (evidence.validUntil !== null && evidence.validUntil <= now)
    );
    if (invalid) {
      throw new BadRequestException({ code: "EVIDENCE_NOT_VERIFIED", message: "All linked evidence must be verified, current and market-compatible" });
    }
  }

  private async getTransitionRecord(resource: TrustedDataResource, id: string, marketId: string): Promise<EvidenceBackedRecord & { validUntil?: Date | null }> {
    let record: (EvidenceBackedRecord & { validUntil?: Date | null }) | null = null;
    switch (resource) {
      case "evidence": {
        const evidence = await this.prisma.evidence.findFirst({ where: { id, marketId } });
        if (evidence) record = { ...evidence, marketId, reviewState: evidence.reviewState, validUntil: evidence.validUntil, evidenceLinks: [] };
        break;
      }
      case "policies": {
        const policy = await this.prisma.countryPolicy.findFirst({ where: { id, marketId }, include: { evidenceLinks: { include: { evidence: true } } } });
        if (policy) record = { ...policy, validUntil: policy.expiresAt };
        break;
      }
      case "policy-news": {
        const news = await this.prisma.policyNewsItem.findFirst({ where: { id, marketId }, include: { evidenceLinks: { include: { evidence: true } } } });
        if (news) record = { ...news, validUntil: null };
        break;
      }
      case "eligibility":
        record = await this.prisma.vehicleMarketEligibility.findFirst({ where: { id, marketId }, include: { evidenceLinks: { include: { evidence: true } } } });
        break;
      case "supplier-capabilities":
        record = await this.prisma.supplierMarketCapability.findFirst({ where: { id, marketId }, include: { evidenceLinks: { include: { evidence: true } } } });
        break;
      case "price-observations":
        record = await this.prisma.priceObservation.findFirst({ where: { id, marketId }, include: { evidenceLinks: { include: { evidence: true } } } });
        break;
      case "suppliers": {
        const supplier = await this.prisma.supplier.findUnique({ where: { id } });
        if (supplier) record = { ...supplier, marketId, reviewState: supplier.reviewState, evidenceLinks: [] };
        break;
      }
    }
    if (!record) throw new NotFoundException({ code: "TRUSTED_DATA_NOT_FOUND", message: "Trusted data record not found in this market" });
    return record;
  }

  private updateState(tx: Prisma.TransactionClient, resource: TrustedDataResource, id: string, reviewState: ReviewState, reviewerId: string) {
    const review = { reviewState, reviewedById: reviewerId, reviewedAt: new Date() };
    switch (resource) {
      case "evidence": return tx.evidence.update({ where: { id }, data: review });
      case "policies": return tx.countryPolicy.update({ where: { id }, data: review });
      case "policy-news": return tx.policyNewsItem.update({ where: { id }, data: review });
      case "eligibility": return tx.vehicleMarketEligibility.update({ where: { id }, data: review });
      case "suppliers": return tx.supplier.update({ where: { id }, data: review });
      case "supplier-capabilities": return tx.supplierMarketCapability.update({ where: { id }, data: review });
      case "price-observations": return tx.priceObservation.update({ where: { id }, data: review });
    }
  }
}
