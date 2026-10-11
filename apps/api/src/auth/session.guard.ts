import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { createHash } from "node:crypto";
import { PrismaService } from "../database/prisma.service";
import { IS_PUBLIC_KEY } from "../common/decorators";
import type { AuthenticatedRequest } from "../common/request-context";

const hashToken = (value: string) => createHash("sha256").update(value).digest("hex");

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector, @Inject(PrismaService) private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext) {
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()])) return true;
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const cookieName = process.env.SESSION_COOKIE_NAME || "hcc_session";
    const rawToken = request.cookies?.[cookieName] as string | undefined;
    if (!rawToken) throw new UnauthorizedException({ code: "AUTH_REQUIRED", message: "Authentication required" });

    const session = await this.prisma.session.findUnique({
      where: { tokenHash: hashToken(rawToken) },
      include: {
        user: {
          include: {
            memberships: {
              include: {
                marketScopes: { include: { market: true } },
                organization: {
                  include: {
                    subscriptions: {
                      where: { status: "ACTIVE", OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }] },
                      include: { marketScopes: { include: { market: true } } }
                    }
                  }
                }
              },
              orderBy: { createdAt: "asc" },
              take: 1
            }
          }
        }
      }
    });
    if (!session || session.expiresAt <= new Date() || session.user.memberships.length === 0) {
      throw new UnauthorizedException({ code: "SESSION_INVALID", message: "Session expired or invalid" });
    }

    const membership = session.user.memberships[0]!;
    const assignedScopes = membership.marketScopes.map((scope) => scope.market.code as "DZ" | "IR");
    const subscriptionScopes = membership.organization.subscriptions.flatMap((item) => item.marketScopes.map((scope) => scope.market.code as "DZ" | "IR"));
    request.sessionId = session.id;
    request.user = {
      id: session.user.id,
      email: session.user.email,
      organizationId: membership.organizationId,
      role: membership.role,
      marketScopes: [...new Set(membership.role === "ANALYST" ? assignedScopes : [...assignedScopes, ...subscriptionScopes])]
    };
    return true;
  }
}
