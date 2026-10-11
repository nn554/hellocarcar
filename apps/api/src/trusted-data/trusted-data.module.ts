import { Module } from "@nestjs/common";
import { MarketsModule } from "../markets/markets.module";
import { TrustedDataController } from "./trusted-data.controller";
import { TrustedDataService } from "./trusted-data.service";
import { PublicPoliciesController } from "./public-policies.controller";

@Module({
  imports: [MarketsModule],
  controllers: [TrustedDataController, PublicPoliciesController],
  providers: [TrustedDataService]
})
export class TrustedDataModule {}
