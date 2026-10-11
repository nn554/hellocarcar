import { Body, Controller, Get, Inject, Param, Patch, Query } from "@nestjs/common";
import { reviewTaskListQuerySchema, updateReviewTaskSchema } from "@hellocarcar/contracts";
import type { SessionUser } from "@hellocarcar/contracts";
import { CurrentUser, Roles } from "../common/decorators";
import { parseWithSchema } from "../common/zod";
import { ReviewTasksService } from "./review-tasks.service";

@Roles("ANALYST", "REVIEWER", "ADMIN")
@Controller("v1/admin/review-tasks")
export class ReviewTasksController {
  constructor(@Inject(ReviewTasksService) private readonly reviewTasks: ReviewTasksService) {}

  @Get()
  list(@CurrentUser() user: SessionUser, @Query() rawQuery: unknown) {
    const query = parseWithSchema(reviewTaskListQuerySchema, rawQuery);
    return this.reviewTasks.list(user, {
      ...query,
      marketCode: query.marketCode ?? "DZ",
      status: query.status ?? "OPEN",
      type: query.type ?? "ALL",
      limit: query.limit ?? 25
    });
  }

  @Roles("ADMIN")
  @Patch(":id")
  update(
    @CurrentUser() user: SessionUser,
    @Param("id") id: string,
    @Query() rawQuery: unknown,
    @Body() body: unknown
  ) {
    const query = parseWithSchema(reviewTaskListQuerySchema.pick({ marketCode: true }), rawQuery);
    const input = parseWithSchema(updateReviewTaskSchema, body);
    return this.reviewTasks.update(user, id, query.marketCode ?? "DZ", input);
  }
}
