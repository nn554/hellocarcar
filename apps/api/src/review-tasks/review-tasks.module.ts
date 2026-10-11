import { Module } from "@nestjs/common";
import { MarketsModule } from "../markets/markets.module";
import { ReviewTasksController } from "./review-tasks.controller";
import { ReviewTasksService } from "./review-tasks.service";

@Module({
  imports: [MarketsModule],
  controllers: [ReviewTasksController],
  providers: [ReviewTasksService]
})
export class ReviewTasksModule {}
