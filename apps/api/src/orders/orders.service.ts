import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import type { SessionUser } from "@hellocarcar/contracts";
import { PrismaService } from "../database/prisma.service";
import { MarketAccessService } from "../markets/market-access.service";

@Injectable()
export class OrdersService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService, @Inject(MarketAccessService) private readonly marketAccess: MarketAccessService) {}

  async lookup(user: SessionUser, input: { marketCode: "DZ" | "IR"; pi?: string; vin?: string }) {
    const market = await this.marketAccess.getMarket(input.marketCode);
    const order = await this.prisma.pIOrder.findFirst({
      where: {
        marketId: market.id,
        organizationId: user.organizationId,
        ...(input.pi ? { piNumber: input.pi } : { vehicles: { some: { vin: input.vin } } })
      },
      include: {
        vehicles: {
          where: input.vin ? { vin: input.vin } : undefined,
          include: { vehicleModel: true, logisticsEvents: { where: { visibility: "CUSTOMER" }, orderBy: [{ occurredAt: "asc" }, { expectedAt: "asc" }] } }
        }
      }
    });
    if (!order) throw new HttpException({ code: "ORDER_NOT_FOUND", message: "No owned order matched this lookup" }, HttpStatus.NOT_FOUND);
    await this.prisma.auditLog.create({ data: { actorId: user.id, action: "ORDER_LOOKUP", entityType: "PIOrder", entityId: order.id, marketCode: input.marketCode } });
    return order;
  }
}
