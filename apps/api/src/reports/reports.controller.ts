import { Body, Controller, Get, Inject, Param, Post } from "@nestjs/common";
import { createReportSchema, type SessionUser } from "@hellocarcar/contracts";
import { CurrentUser } from "../common/decorators";
import { parseWithSchema } from "../common/zod";
import { ReportsService } from "./reports.service";

@Controller("v1/reports")
export class ReportsController {
  constructor(@Inject(ReportsService) private readonly reports: ReportsService) {}

  @Post()
  create(@CurrentUser() user: SessionUser, @Body() body: unknown) {
    const input = parseWithSchema(createReportSchema, body);
    return this.reports.create(user, { ...input, reportType: input.reportType ?? "STANDARD" });
  }

  @Get()
  list(@CurrentUser() user: SessionUser) {
    return this.reports.list(user);
  }

  @Get(":id")
  get(@CurrentUser() user: SessionUser, @Param("id") id: string) {
    return this.reports.get(user, id);
  }

  @Get(":id/download")
  download(@CurrentUser() user: SessionUser, @Param("id") id: string) {
    return this.reports.download(user, id);
  }
}
