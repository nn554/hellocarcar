import { randomUUID } from "node:crypto";
import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { EntitlementKind } from "@hellocarcar/db";
import { supplierScoreDimensionsSchema, type SessionUser, type SupplierRecommendationQuery } from "@hellocarcar/contracts";
import { PrismaService } from "../database/prisma.service";
import { MarketAccessService } from "../markets/market-access.service";
import { calculateSupplierScore } from "./supplier-scoring";

@Injectable()
export class SuppliersService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(MarketAccessService) private readonly marketAccess: MarketAccessService
  ) {}

  async recommend(user: SessionUser, input: SupplierRecommendationQuery) {
    const market = await this.marketAccess.getMarket(input.marketCode);
    const vip = await this.marketAccess.hasVip(user, market.id);
    if (!vip) {
      const used = await this.prisma.entitlementUsage.count({
        where: { organizationId: user.organizationId, marketId: market.id, kind: EntitlementKind.FREE_DECISION }
      });
      if (used >= 3) throw new HttpException({ code: "VIP_REQUIRED", message: "The three lifetime free queries have been used" }, HttpStatus.PAYMENT_REQUIRED);
    }

    const now = new Date();
    const suppliers = await this.prisma.supplier.findMany({
      where: {
        reviewState: "VERIFIED",
        reviewedById: { not: null },
        capabilities: {
          some: {
            marketId: market.id,
            reviewState: "VERIFIED",
            reviewedById: { not: null },
            evidenceLinks: {
              some: {
                evidence: {
                  reviewState: "VERIFIED",
                  reviewedById: { not: null },
                  OR: [{ validUntil: null }, { validUntil: { gt: now } }]
                }
              }
            }
          }
        }
      },
      include: {
        capabilities: {
          where: { marketId: market.id, reviewState: "VERIFIED", reviewedById: { not: null } },
          include: { evidenceLinks: { include: { evidence: true } } }
        }
      },
      take: 200
    });

    const normalizedQuery = input.query?.toLocaleLowerCase();
    const scored = suppliers.flatMap((supplier) => {
      const capability = supplier.capabilities[0];
      if (!capability) return [];
      const parsed = supplierScoreDimensionsSchema.safeParse(capability.dimensions ?? {});
      if (!parsed.success) return [];
      const matches = !normalizedQuery
        || supplier.legalName.toLocaleLowerCase().includes(normalizedQuery)
        || supplier.displayName.toLocaleLowerCase().includes(normalizedQuery)
        || parsed.data.brands?.some((brand) => brand.toLocaleLowerCase().includes(normalizedQuery));
      if (!matches) return [];
      const score = calculateSupplierScore(parsed.data);
      const updatedAt = capability.evidenceLinks.reduce((latest, link) => link.evidence.observedAt > latest ? link.evidence.observedAt : latest, supplier.updatedAt);
      return [{
        id: supplier.id,
        legalName: supplier.legalName,
        displayName: supplier.displayName,
        countryCode: supplier.countryCode,
        brands: parsed.data.brands ?? [],
        employeeCount: vip ? parsed.data.employeeCount ?? null : null,
        score: vip ? score.score : null,
        recommendation: vip ? score.recommendation : null,
        completeness: score.completeness,
        forcedDowngrade: score.forcedDowngrade,
        riskCount: Object.entries(parsed.data.risks ?? {}).filter(([key, value]) => key !== "severe" && value === true).length,
        lockedFields: vip ? [] : ["employeeCount", "score", "recommendation", "breakdown"],
        breakdown: vip ? score.breakdown : null,
        queryDate: now,
        updatedAt
      }];
    });
    scored.sort((left, right) =>
      (right.score ?? -1) - (left.score ?? -1)
      || right.completeness - left.completeness
      || right.updatedAt.getTime() - left.updatedAt.getTime()
      || left.id.localeCompare(right.id)
    );
    const items = scored.slice(0, input.limit);
    if (!vip && items.length > 0) {
      await this.prisma.entitlementUsage.create({
        data: {
          organizationId: user.organizationId,
          marketId: market.id,
          kind: EntitlementKind.FREE_DECISION,
          resourceId: `supplier-recommendations:${randomUUID()}`,
          periodKey: "lifetime"
        }
      });
    }
    return { items, returnedCount: items.length, requestedCount: input.limit, queryDate: now };
  }
}
