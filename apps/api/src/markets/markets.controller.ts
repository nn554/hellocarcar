import { Controller, Get, Inject } from "@nestjs/common";
import { Public } from "../common/decorators";
import { PrismaService } from "../database/prisma.service";

@Controller("v1/markets")
export class MarketsController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  list() {
    return this.prisma.market.findMany({
      orderBy: { code: "asc" },
      select: { code: true, name: true, timezone: true, defaultCurrency: true, status: true, locales: { select: { locale: true, label: true, direction: true, isDefault: true } } }
    });
  }
}
