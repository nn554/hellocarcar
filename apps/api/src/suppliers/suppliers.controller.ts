import { Body, Controller, Inject, Post } from "@nestjs/common";
import { supplierRecommendationQuerySchema, type SessionUser } from "@hellocarcar/contracts";
import { CurrentUser } from "../common/decorators";
import { parseWithSchema } from "../common/zod";
import { SuppliersService } from "./suppliers.service";

@Controller("v1/suppliers")
export class SuppliersController {
  constructor(@Inject(SuppliersService) private readonly suppliers: SuppliersService) {}

  @Post("recommendations")
  recommend(@CurrentUser() user: SessionUser, @Body() body: unknown) {
    const input = parseWithSchema(supplierRecommendationQuerySchema, body);
    return this.suppliers.recommend(user, { ...input, marketCode: input.marketCode ?? "DZ", limit: input.limit ?? 5 });
  }
}
