import { randomUUID } from "node:crypto";
import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { EntitlementKind } from "@hellocarcar/db";
import { shippingQuoteMetadataSchema, type SessionUser, type ShippingQuoteQuery } from "@hellocarcar/contracts";
import { PrismaService } from "../database/prisma.service";
import { MarketAccessService } from "../markets/market-access.service";

@Injectable()
export class ShippingService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(MarketAccessService) private readonly marketAccess: MarketAccessService
  ) {}

  async quote(user: SessionUser, input: ShippingQuoteQuery) {
    const market = await this.marketAccess.getMarket(input.marketCode);
    const vip = await this.marketAccess.hasVip(user, market.id);
    if (!vip) {
      const used = await this.prisma.entitlementUsage.count({ where: { organizationId: user.organizationId, marketId: market.id, kind: EntitlementKind.FREE_DECISION } });
      if (used >= 3) throw new HttpException({ code: "VIP_REQUIRED", message: "The three lifetime free queries have been used" }, HttpStatus.PAYMENT_REQUIRED);
    }
    const evidence = await this.prisma.evidence.findMany({
      where: { marketId: market.id, kind: "SHIPPING_QUOTE", reviewState: { in: ["VERIFIED", "EXPIRED"] }, reviewedById: { not: null } },
      orderBy: { observedAt: "desc" },
      take: 200
    });
    const normalizedOrigin = input.originPort.toLocaleLowerCase();
    const normalizedDestination = input.destinationPort.toLocaleLowerCase();
    const matches = evidence.flatMap((item) => {
      const parsed = shippingQuoteMetadataSchema.safeParse(item.metadata);
      if (!parsed.success) return [];
      const metadata = parsed.data;
      if (metadata.originPort.toLocaleLowerCase() !== normalizedOrigin
        || metadata.destinationPort.toLocaleLowerCase() !== normalizedDestination
        || metadata.containerType !== input.containerType) return [];
      const stale = item.reviewState === "EXPIRED" || (item.validUntil ? item.validUntil <= new Date() : false);
      return [{
        id: item.id,
        ...metadata,
        currency: "USD",
        stale,
        humanReviewRequired: stale,
        queryDate: new Date(),
        updatedAt: item.observedAt,
        validUntil: item.validUntil
      }];
    });
    matches.sort((left, right) => Number(left.stale) - Number(right.stale) || right.updatedAt.getTime() - left.updatedAt.getTime());
    const result = matches[0];
    if (!result) throw new HttpException({ code: "SHIPPING_QUOTE_NOT_FOUND", message: "No matching container shipping quote is available" }, HttpStatus.NOT_FOUND);
    if (!vip) {
      await this.prisma.entitlementUsage.create({ data: {
        organizationId: user.organizationId,
        marketId: market.id,
        kind: EntitlementKind.FREE_DECISION,
        resourceId: `shipping-quote:${randomUUID()}`,
        periodKey: "lifetime"
      } });
    }
    return result;
  }
}
