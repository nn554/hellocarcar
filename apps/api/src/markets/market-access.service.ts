import { HttpException, HttpStatus, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { SessionUser } from "@hellocarcar/contracts";
import { PrismaService } from "../database/prisma.service";

@Injectable()
export class MarketAccessService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getMarket(code: string, allowPlanned = false) {
    const market = await this.prisma.market.findUnique({ where: { code }, include: { locales: true } });
    if (!market || market.status === "PAUSED" || (!allowPlanned && market.status !== "ACTIVE")) {
      throw new NotFoundException({ code: "MARKET_UNAVAILABLE", message: "Market is unavailable" });
    }
    return market;
  }

  async hasVip(user: SessionUser, marketId: string, now = new Date()) {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        organizationId: user.organizationId,
        status: "ACTIVE",
        startsAt: { lte: now },
        endsAt: { gt: now },
        marketScopes: { some: { marketId } }
      },
      select: { id: true }
    });
    return Boolean(subscription);
  }

  async requireVip(user: SessionUser, marketId: string) {
    if (!(await this.hasVip(user, marketId))) {
      throw new HttpException({ code: "VIP_REQUIRED", message: "An active VIP subscription for this market is required" }, HttpStatus.PAYMENT_REQUIRED);
    }
  }
}
