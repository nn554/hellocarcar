import { Body, Controller, Get, Inject, Post } from "@nestjs/common";
import { createDecisionSchema, type SessionUser } from "@hellocarcar/contracts";
import { CurrentUser } from "../common/decorators";
import { parseWithSchema } from "../common/zod";
import { DecisionsService } from "./decisions.service";

@Controller("v1/decisions")
export class DecisionsController {
  constructor(@Inject(DecisionsService) private readonly decisions: DecisionsService) {}

  @Post()
  create(@CurrentUser() user: SessionUser, @Body() body: unknown) {
    return this.decisions.create(user, parseWithSchema(createDecisionSchema, body));
  }

  @Get()
  list(@CurrentUser() user: SessionUser) {
    return this.decisions.list(user);
  }
}
