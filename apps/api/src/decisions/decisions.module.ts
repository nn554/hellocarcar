import { Module } from "@nestjs/common";
import { DECISION_PROVIDER, UnconfiguredDecisionProvider } from "./decision-provider";
import { DecisionsController } from "./decisions.controller";
import { DecisionsService } from "./decisions.service";

@Module({
  controllers: [DecisionsController],
  providers: [DecisionsService, { provide: DECISION_PROVIDER, useClass: UnconfiguredDecisionProvider }],
  exports: [DecisionsService]
})
export class DecisionsModule {}
