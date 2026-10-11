import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { EntitlementKind } from "@hellocarcar/db";
import type { SessionUser } from "@hellocarcar/contracts";
import { PrismaService } from "../database/prisma.service";
import { MarketAccessService } from "../markets/market-access.service";
import { DECISION_PROVIDER, type DecisionProvider } from "./decision-provider";

@Injectable()
export class DecisionsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(MarketAccessService) private readonly marketAccess: MarketAccessService,
    @Inject(DECISION_PROVIDER) private readonly provider: DecisionProvider
  ) {}

  list(user: SessionUser) {
    return this.prisma.decisionQuery.findMany({
      where: { userId: user.id },
      include: { market: { select: { code: true } }, vehicleModel: { select: { id: true, make: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100
    });
  }

  async create(user: SessionUser, input: { marketCode: "DZ" | "IR"; locale: string; question: string; vehicleModelId?: string }) {
    const market = await this.marketAccess.getMarket(input.marketCode);
    const vip = await this.marketAccess.hasVip(user, market.id);
    const now = new Date();
    if (vip) {
      const hourStart = new Date(now.getTime() - 3_600_000);
      const dayStart = new Date(now.getTime() - 86_400_000);
      const [hourCount, dayCount] = await Promise.all([
        this.prisma.decisionQuery.count({ where: { userId: user.id, marketId: market.id, createdAt: { gte: hourStart } } }),
        this.prisma.decisionQuery.count({ where: { userId: user.id, marketId: market.id, createdAt: { gte: dayStart } } })
      ]);
      if (hourCount >= 10 || dayCount >= 50) throw new HttpException({ code: "DECISION_RATE_LIMITED", message: "Decision fair-use limit reached" }, HttpStatus.TOO_MANY_REQUESTS);
    } else {
      const used = await this.prisma.entitlementUsage.count({ where: { organizationId: user.organizationId, marketId: market.id, kind: EntitlementKind.FREE_DECISION } });
      if (used >= 3) throw new HttpException({ code: "VIP_REQUIRED", message: "The three lifetime free queries have been used" }, HttpStatus.PAYMENT_REQUIRED);
    }

    const decision = await this.prisma.decisionQuery.create({
      data: { userId: user.id, marketId: market.id, vehicleModelId: input.vehicleModelId, locale: input.locale, question: input.question, status: "PROCESSING" }
    });
    const evidence = await this.prisma.evidence.findMany({
      where: {
        reviewState: "VERIFIED",
        OR: [{ scope: "GLOBAL" }, { scope: "MARKET", marketId: market.id }],
        AND: [{ OR: [{ validUntil: null }, { validUntil: { gt: now } }] }]
      },
      orderBy: { observedAt: "desc" },
      take: 12
    });

    try {
      const answer = await this.provider.createBriefDecision({
        marketCode: input.marketCode,
        locale: input.locale,
        question: input.question,
        evidence: evidence.map((item) => ({ id: item.id, title: item.title, content: JSON.stringify(item.metadata ?? {}), sourceDate: item.observedAt }))
      });
      const completed = await this.prisma.decisionQuery.update({ where: { id: decision.id }, data: { status: answer.reviewRequired ? "HUMAN_REVIEW_REQUIRED" : "COMPLETED", answer, confidence: answer.confidence, completedAt: new Date() } });
      if (!vip && !answer.reviewRequired) {
        await this.prisma.entitlementUsage.create({ data: { organizationId: user.organizationId, marketId: market.id, kind: EntitlementKind.FREE_DECISION, resourceId: decision.id, periodKey: "lifetime" } });
      }
      return completed;
    } catch (error) {
      await this.prisma.reviewTask.create({ data: { marketId: market.id, type: "DECISION", entityType: "DecisionQuery", entityId: decision.id, reason: error instanceof Error ? error.message : "AI_PROVIDER_FAILED" } });
      return this.prisma.decisionQuery.update({ where: { id: decision.id }, data: { status: "HUMAN_REVIEW_REQUIRED" } });
    }
  }
}
