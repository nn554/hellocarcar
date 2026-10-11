import { Body, Controller, Get, Headers, Inject, Param, Post, Put } from "@nestjs/common";
import { telegramBotActionSchema, telegramConversationUpdateSchema, type TelegramBotActionInput } from "@hellocarcar/contracts";
import { AuthService } from "../auth/auth.service";
import { Public } from "../common/decorators";
import { parseWithSchema } from "../common/zod";
import { BotGatewayService } from "./bot-gateway.service";

@Public()
@Controller("v1/bot")
export class BotGatewayController {
  constructor(@Inject(AuthService) private readonly auth: AuthService, @Inject(BotGatewayService) private readonly gateway: BotGatewayService) {}

  @Get("conversations/:telegramUserId")
  conversation(@Param("telegramUserId") telegramUserId: string, @Headers("x-telegram-bot-secret") secret?: string) {
    return this.auth.getTelegramConversation(telegramUserId, secret);
  }

  @Put("conversations/:telegramUserId")
  updateConversation(@Param("telegramUserId") telegramUserId: string, @Body() body: unknown, @Headers("x-telegram-bot-secret") secret?: string) {
    const input = parseWithSchema(telegramConversationUpdateSchema, body);
    return this.auth.updateTelegramConversation(telegramUserId, { ...input, context: input.context ?? {} }, secret);
  }

  @Post("actions")
  action(@Body() body: unknown, @Headers("x-telegram-bot-secret") secret?: string) {
    const input = parseWithSchema(telegramBotActionSchema, body);
    return this.gateway.execute({ ...input, marketCode: "DZ" } as TelegramBotActionInput, secret);
  }
}
