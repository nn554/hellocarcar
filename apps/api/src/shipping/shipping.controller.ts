import { Body, Controller, Inject, Post } from "@nestjs/common";
import { shippingQuoteQuerySchema, type SessionUser } from "@hellocarcar/contracts";
import { CurrentUser } from "../common/decorators";
import { parseWithSchema } from "../common/zod";
import { ShippingService } from "./shipping.service";

@Controller("v1/shipping")
export class ShippingController {
  constructor(@Inject(ShippingService) private readonly shipping: ShippingService) {}

  @Post("quotes")
  quote(@CurrentUser() user: SessionUser, @Body() body: unknown) {
    const input = parseWithSchema(shippingQuoteQuerySchema, body);
    return this.shipping.quote(user, { ...input, marketCode: input.marketCode ?? "DZ", containerType: input.containerType ?? "40HQ" });
  }
}
