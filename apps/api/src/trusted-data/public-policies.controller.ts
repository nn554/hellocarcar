import { Controller, Get, Inject, Query } from "@nestjs/common";
import { marketCodeSchema } from "@hellocarcar/contracts";
import { Public } from "../common/decorators";
import { parseWithSchema } from "../common/zod";
import { TrustedDataService } from "./trusted-data.service";

@Public()
@Controller("v1/policies")
export class PublicPoliciesController {
  constructor(@Inject(TrustedDataService) private readonly trustedData: TrustedDataService) {}

  @Get()
  list(@Query() query: unknown) {
    const marketCode = parseWithSchema(marketCodeSchema, (query as { marketCode?: unknown })?.marketCode);
    return this.trustedData.listCurrentPolicies(marketCode);
  }

  @Get("news")
  news(@Query() query: unknown) {
    const marketCode = parseWithSchema(marketCodeSchema, (query as { marketCode?: unknown })?.marketCode);
    return this.trustedData.listCurrentPolicyNews(marketCode);
  }
}
