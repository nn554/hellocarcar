import { Controller, Get, Inject, Query } from "@nestjs/common";
import { orderLookupSchema, type SessionUser } from "@hellocarcar/contracts";
import { CurrentUser } from "../common/decorators";
import { parseWithSchema } from "../common/zod";
import { OrdersService } from "./orders.service";

@Controller("v1/orders")
export class OrdersController {
  constructor(@Inject(OrdersService) private readonly orders: OrdersService) {}

  @Get("lookup")
  lookup(@CurrentUser() user: SessionUser, @Query() query: unknown) {
    return this.orders.lookup(user, parseWithSchema(orderLookupSchema, query));
  }
}
