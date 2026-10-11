import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { UserRole } from "@hellocarcar/contracts";
import { ROLES_KEY } from "../common/decorators";
import type { AuthenticatedRequest } from "../common/request-context";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (!roles?.length) return true;
    const user = context.switchToHttp().getRequest<AuthenticatedRequest>().user;
    if (!roles.includes(user.role)) throw new ForbiddenException({ code: "ROLE_FORBIDDEN", message: "Insufficient role" });
    return true;
  }
}
