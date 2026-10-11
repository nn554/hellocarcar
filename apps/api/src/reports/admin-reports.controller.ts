import { Body, Controller, Get, Inject, Param, Patch } from "@nestjs/common";
import { reviewReportSchema, type SessionUser } from "@hellocarcar/contracts";
import { CurrentUser, Roles } from "../common/decorators";
import { parseWithSchema } from "../common/zod";
import { ReportsService } from "./reports.service";

@Controller("v1/admin/reports")
@Roles("REVIEWER", "ADMIN")
export class AdminReportsController {
  constructor(@Inject(ReportsService) private readonly reports: ReportsService) {}

  @Get(":id")
  get(@CurrentUser() user: SessionUser, @Param("id") id: string) {
    return this.reports.getForReview(user, id);
  }

  @Patch(":id/review")
  review(@CurrentUser() user: SessionUser, @Param("id") id: string, @Body() body: unknown) {
    return this.reports.review(user, id, parseWithSchema(reviewReportSchema, body));
  }
}
