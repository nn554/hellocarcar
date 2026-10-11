import { AbilityBuilder, createMongoAbility } from "@casl/ability";
import { Injectable } from "@nestjs/common";
import type { SessionUser } from "@hellocarcar/contracts";

@Injectable()
export class AbilityFactory {
  createForUser(user: SessionUser) {
    const { can, build } = new AbilityBuilder(createMongoAbility);
    can("read", "Vehicle");
    can("create", "Decision", { organizationId: user.organizationId });
    can("create", "Report", { organizationId: user.organizationId });
    can("read", "Order", { organizationId: user.organizationId });
    if (user.role === "ANALYST") {
      can("review", "Report");
      can("manage", "TrustedData", { marketCode: { $in: user.marketScopes } });
    }
    if (user.role === "FINANCE") can("review", "Payment");
    if (user.role === "ADMIN") can("manage", "all");
    return build();
  }
}
