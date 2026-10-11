import { Body, Controller, Get, Headers, Inject, Ip, Param, Post, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { claimTelegramLinkSchema, requestOtpSchema, telegramProfileSchema, verifyOtpSchema } from "@hellocarcar/contracts";
import { AuthService } from "./auth.service";
import { CurrentUser, Public } from "../common/decorators";
import { parseWithSchema } from "../common/zod";
import type { AuthenticatedRequest } from "../common/request-context";
import type { SessionUser } from "@hellocarcar/contracts";

@Controller("v1/auth")
export class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  @Public()
  @Post("otp/request")
  requestOtp(@Body() body: unknown, @Ip() ip: string) {
    const input = parseWithSchema(requestOtpSchema, body);
    return this.auth.requestOtp(input.email, input.marketCode ?? "DZ", ip);
  }

  @Public()
  @Post("otp/verify")
  async verifyOtp(@Body() body: unknown, @Ip() ip: string, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const input = parseWithSchema(verifyOtpSchema, body);
    const result = await this.auth.verifyOtp(input.email, input.code, input.marketCode ?? "DZ", ip, request.headers["user-agent"]);
    const cookieName = process.env.SESSION_COOKIE_NAME || "hcc_session";
    response.cookie(cookieName, result.rawToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: Number(process.env.SESSION_TTL_HOURS || 168) * 3_600_000,
      path: "/"
    });
    return { user: { id: result.user.id, email: result.user.email, role: result.membership.role, organizationId: result.membership.organizationId } };
  }

  @Get("me")
  me(@CurrentUser() user: SessionUser) {
    return this.auth.getMe(user);
  }

  @Post("telegram/link-token")
  createTelegramLink(@CurrentUser() user: SessionUser) {
    return this.auth.createTelegramLink(user);
  }

  @Public()
  @Post("telegram/claim")
  claimTelegramLink(@Body() body: unknown, @Headers("x-telegram-bot-secret") botSecret?: string) {
    return this.auth.claimTelegramLink(parseWithSchema(claimTelegramLinkSchema, body), botSecret);
  }

  @Public()
  @Get("telegram/status/:telegramUserId")
  telegramStatus(@Param("telegramUserId") rawTelegramUserId: string, @Headers("x-telegram-bot-secret") botSecret?: string) {
    const telegramUserId = parseWithSchema(telegramProfileSchema.pick({ telegramUserId: true }), { telegramUserId: rawTelegramUserId }).telegramUserId;
    return this.auth.getTelegramStatus(telegramUserId, botSecret);
  }

  @Post("logout")
  async logout(@Req() request: AuthenticatedRequest, @Res({ passthrough: true }) response: Response) {
    await this.auth.logout(request.sessionId);
    response.clearCookie(process.env.SESSION_COOKIE_NAME || "hcc_session", { path: "/" });
    return { loggedOut: true };
  }
}
