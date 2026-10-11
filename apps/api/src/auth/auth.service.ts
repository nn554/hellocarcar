import { ConflictException, ForbiddenException, HttpException, HttpStatus, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import type { ClaimTelegramLinkInput, SessionUser, TelegramConversationUpdateInput } from "@hellocarcar/contracts";
import { Prisma } from "@hellocarcar/db";
import { PrismaService } from "../database/prisma.service";

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

@Injectable()
export class AuthService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private otpHash(email: string, code: string) {
    const secret = process.env.OTP_SECRET || "development-only-otp-secret-change-me";
    return sha256(`${email.toLowerCase()}:${code}:${secret}`);
  }

  async requestOtp(emailInput: string, marketCode: string, requestIp?: string) {
    const email = emailInput.trim().toLowerCase();
    const since = new Date(Date.now() - 10 * 60_000);
    const recent = await this.prisma.otpChallenge.count({ where: { email, createdAt: { gte: since } } });
    if (recent >= 3) throw new HttpException({ code: "OTP_RATE_LIMITED", message: "Too many OTP requests" }, HttpStatus.TOO_MANY_REQUESTS);
    const market = await this.prisma.market.findUnique({ where: { code: marketCode } });
    if (!market || market.status === "PAUSED") throw new HttpException({ code: "MARKET_UNAVAILABLE", message: "Market is unavailable" }, HttpStatus.NOT_FOUND);

    const code = randomInt(100000, 1_000_000).toString();
    const ttlMinutes = Number(process.env.OTP_TTL_MINUTES || 10);
    await this.prisma.otpChallenge.create({
      data: { email, codeHash: this.otpHash(email, code), requestIp, expiresAt: new Date(Date.now() + ttlMinutes * 60_000) }
    });

    const consoleMode = (process.env.EMAIL_DELIVERY_MODE || "console") === "console";
    if (consoleMode) console.log(`[development OTP] ${email}: ${code}`);
    return { sent: true, expiresInSeconds: ttlMinutes * 60, ...(consoleMode && process.env.NODE_ENV !== "production" ? { debugCode: code } : {}) };
  }

  async verifyOtp(emailInput: string, code: string, marketCode: string, requestIp?: string, userAgent?: string) {
    const email = emailInput.trim().toLowerCase();
    const challenge = await this.prisma.otpChallenge.findFirst({ where: { email, consumedAt: null }, orderBy: { createdAt: "desc" } });
    if (!challenge || challenge.expiresAt <= new Date() || challenge.attempts >= 5) {
      throw new UnauthorizedException({ code: "OTP_INVALID", message: "OTP is invalid or expired" });
    }
    await this.prisma.otpChallenge.update({ where: { id: challenge.id }, data: { attempts: { increment: 1 } } });
    const actual = Buffer.from(challenge.codeHash, "hex");
    const expected = Buffer.from(this.otpHash(email, code), "hex");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
      throw new UnauthorizedException({ code: "OTP_INVALID", message: "OTP is invalid or expired" });
    }

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.otpChallenge.update({ where: { id: challenge.id }, data: { consumedAt: new Date() } });
      let user = await tx.user.findUnique({ where: { email }, include: { memberships: true } });
      if (!user) {
        const organization = await tx.organization.create({ data: { name: `${email.split("@")[0]} organization` } });
        user = await tx.user.create({
          data: { email, emailVerifiedAt: new Date(), memberships: { create: { organizationId: organization.id, role: "BUYER" } } },
          include: { memberships: true }
        });
      } else if (user.memberships.length === 0) {
        const organization = await tx.organization.create({ data: { name: `${email.split("@")[0]} organization` } });
        await tx.membership.create({ data: { userId: user.id, organizationId: organization.id, role: "BUYER" } });
        user = await tx.user.findUniqueOrThrow({ where: { id: user.id }, include: { memberships: true } });
      }

      const rawToken = randomBytes(32).toString("base64url");
      const ttlHours = Number(process.env.SESSION_TTL_HOURS || 168);
      const session = await tx.session.create({
        data: { userId: user.id, tokenHash: sha256(rawToken), ipAddress: requestIp, userAgent, expiresAt: new Date(Date.now() + ttlHours * 3_600_000) }
      });
      await tx.auditLog.create({ data: { actorId: user.id, action: "AUTH_OTP_VERIFIED", entityType: "Session", entityId: session.id, marketCode } });
      return { rawToken, session, user, membership: user.memberships[0]! };
    });

    return result;
  }

  async logout(sessionId: string) {
    await this.prisma.session.deleteMany({ where: { id: sessionId } });
  }

  async createTelegramLink(user: SessionUser) {
    const rawToken = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + 10 * 60_000);
    await this.prisma.$transaction(async (tx) => {
      await tx.accountLinkToken.deleteMany({ where: { userId: user.id, OR: [{ consumedAt: { not: null } }, { expiresAt: { lte: new Date() } }] } });
      const link = await tx.accountLinkToken.create({ data: { userId: user.id, tokenHash: sha256(rawToken), expiresAt } });
      await tx.auditLog.create({ data: { actorId: user.id, action: "TELEGRAM_LINK_CREATED", entityType: "AccountLinkToken", entityId: link.id } });
    });
    const username = process.env.TELEGRAM_BOT_USERNAME?.replace(/^@/, "");
    return {
      token: rawToken,
      expiresAt,
      ...(username ? { deepLink: `https://t.me/${username}?start=link_${rawToken}` } : {})
    };
  }

  async claimTelegramLink(input: ClaimTelegramLinkInput, providedSecret: string | undefined) {
    this.assertTelegramBotSecret(providedSecret);
    const now = new Date();
    const tokenHash = sha256(input.token);
    return this.prisma.$transaction(async (tx) => {
      const link = await tx.accountLinkToken.findUnique({ where: { tokenHash }, include: { user: { include: { telegramIdentity: true } } } });
      if (!link || link.consumedAt || link.expiresAt <= now) {
        throw new UnauthorizedException({ code: "TELEGRAM_LINK_INVALID", message: "Telegram link is invalid or expired" });
      }
      const consumed = await tx.accountLinkToken.updateMany({ where: { id: link.id, consumedAt: null, expiresAt: { gt: now } }, data: { consumedAt: now } });
      if (consumed.count !== 1) throw new UnauthorizedException({ code: "TELEGRAM_LINK_INVALID", message: "Telegram link is invalid or expired" });

      const existingTelegram = await tx.telegramIdentity.findUnique({ where: { telegramUserId: input.telegramUserId } });
      if (existingTelegram && existingTelegram.userId !== link.userId) {
        throw new ConflictException({ code: "TELEGRAM_ALREADY_LINKED", message: "This Telegram account is already linked" });
      }
      if (link.user.telegramIdentity && link.user.telegramIdentity.telegramUserId !== input.telegramUserId) {
        throw new ConflictException({ code: "USER_TELEGRAM_ALREADY_LINKED", message: "This user already has a different Telegram account" });
      }

      const identity = existingTelegram
        ? await tx.telegramIdentity.update({
            where: { id: existingTelegram.id },
            data: { username: input.username, firstName: input.firstName, lastName: input.lastName, languageCode: input.languageCode, lastSeenAt: now }
          })
        : await tx.telegramIdentity.create({
            data: {
              userId: link.userId,
              telegramUserId: input.telegramUserId,
              username: input.username,
              firstName: input.firstName,
              lastName: input.lastName,
              languageCode: input.languageCode
            }
          });
      await tx.conversationSession.upsert({
        where: { channel_externalConversationId: { channel: "TELEGRAM", externalConversationId: input.telegramUserId } },
        create: { userId: link.userId, telegramIdentityId: identity.id, channel: "TELEGRAM", externalConversationId: input.telegramUserId, state: "IDLE" },
        update: { userId: link.userId, telegramIdentityId: identity.id, state: "IDLE", context: {} }
      });
      await tx.auditLog.create({
        data: { actorId: link.userId, action: "TELEGRAM_ACCOUNT_LINKED", entityType: "TelegramIdentity", entityId: identity.id, metadata: { telegramUserId: input.telegramUserId } }
      });
      return { linked: true, userId: link.userId, email: link.user.email, telegramUserId: identity.telegramUserId };
    });
  }

  async getMe(user: SessionUser) {
    const [identity, subscriptions] = await Promise.all([
      this.prisma.telegramIdentity.findUnique({ where: { userId: user.id }, select: { telegramUserId: true, username: true, linkedAt: true } }),
      this.prisma.subscription.findMany({
        where: { organizationId: user.organizationId, status: "ACTIVE", startsAt: { lte: new Date() }, endsAt: { gt: new Date() } },
        include: { marketScopes: { include: { market: true } } },
        orderBy: { endsAt: "desc" }
      })
    ]);
    return {
      ...user,
      telegram: identity,
      subscriptions: subscriptions.map((subscription) => ({
        id: subscription.id,
        status: subscription.status,
        startsAt: subscription.startsAt,
        endsAt: subscription.endsAt,
        fullReportLimit: subscription.fullReportLimit,
        markets: subscription.marketScopes.map((scope) => scope.market.code)
      }))
    };
  }

  async getTelegramStatus(telegramUserId: string, providedSecret: string | undefined) {
    this.assertTelegramBotSecret(providedSecret);
    const identity = await this.prisma.telegramIdentity.findUnique({
      where: { telegramUserId },
      include: {
        user: {
          include: {
            memberships: {
              take: 1,
              orderBy: { createdAt: "asc" },
              include: {
                organization: {
                  include: {
                    subscriptions: {
                      where: { status: "ACTIVE", OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }] },
                      include: { marketScopes: { include: { market: true } } }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });
    if (!identity) return { linked: false, telegramUserId };
    const membership = identity.user.memberships[0];
    const subscriptions = membership?.organization.subscriptions ?? [];
    return {
      linked: true,
      telegramUserId,
      email: identity.user.email,
      subscriptions: subscriptions.map((subscription) => ({
        id: subscription.id,
        status: subscription.status,
        endsAt: subscription.endsAt,
        markets: subscription.marketScopes.map((scope) => scope.market.code)
      }))
    };
  }

  async resolveTelegramUser(telegramUserId: string, providedSecret: string | undefined): Promise<SessionUser> {
    this.assertTelegramBotSecret(providedSecret);
    const identity = await this.prisma.telegramIdentity.findUnique({
      where: { telegramUserId },
      include: { user: { include: { memberships: { include: { marketScopes: { include: { market: true } } }, orderBy: { createdAt: "asc" }, take: 1 } } } }
    });
    const membership = identity?.user.memberships[0];
    if (!identity || !membership) throw new UnauthorizedException({ code: "TELEGRAM_ACCOUNT_NOT_LINKED", message: "Telegram account is not linked" });
    await this.prisma.telegramIdentity.update({ where: { id: identity.id }, data: { lastSeenAt: new Date() } });
    return {
      id: identity.userId,
      email: identity.user.email,
      organizationId: membership.organizationId,
      role: membership.role,
      marketScopes: membership.marketScopes.map((scope) => scope.market.code as "DZ" | "IR")
    };
  }

  async getTelegramConversation(telegramUserId: string, providedSecret: string | undefined) {
    const user = await this.resolveTelegramUser(telegramUserId, providedSecret);
    const identity = await this.prisma.telegramIdentity.findUniqueOrThrow({ where: { telegramUserId } });
    return this.prisma.conversationSession.upsert({
      where: { channel_externalConversationId: { channel: "TELEGRAM", externalConversationId: telegramUserId } },
      create: { userId: user.id, telegramIdentityId: identity.id, channel: "TELEGRAM", externalConversationId: telegramUserId, state: "IDLE", context: {} },
      update: { userId: user.id, telegramIdentityId: identity.id }
    });
  }

  async updateTelegramConversation(telegramUserId: string, input: TelegramConversationUpdateInput, providedSecret: string | undefined) {
    const user = await this.resolveTelegramUser(telegramUserId, providedSecret);
    const identity = await this.prisma.telegramIdentity.findUniqueOrThrow({ where: { telegramUserId } });
    return this.prisma.conversationSession.upsert({
      where: { channel_externalConversationId: { channel: "TELEGRAM", externalConversationId: telegramUserId } },
      create: { userId: user.id, telegramIdentityId: identity.id, channel: "TELEGRAM", externalConversationId: telegramUserId, state: input.state, context: input.context as Prisma.InputJsonObject },
      update: { userId: user.id, telegramIdentityId: identity.id, state: input.state, context: input.context as Prisma.InputJsonObject }
    });
  }

  private assertTelegramBotSecret(providedSecret: string | undefined) {
    const expectedSecret = process.env.TELEGRAM_BOT_API_SECRET;
    if (!expectedSecret || !providedSecret) throw new ForbiddenException({ code: "TELEGRAM_BOT_FORBIDDEN", message: "Telegram bot authentication is required" });
    const actual = Buffer.from(providedSecret);
    const expected = Buffer.from(expectedSecret);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
      throw new ForbiddenException({ code: "TELEGRAM_BOT_FORBIDDEN", message: "Telegram bot authentication is required" });
    }
  }
}
