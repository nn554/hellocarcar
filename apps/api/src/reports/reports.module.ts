import { Module } from "@nestjs/common";
import { ObjectStorageModule } from "../storage/object-storage.module";
import { AdminReportsController } from "./admin-reports.controller";
import { ReportsQueueService } from "./reports-queue.service";
import { ReportsController } from "./reports.controller";
import { ReportsService } from "./reports.service";

@Module({
  imports: [ObjectStorageModule],
  controllers: [ReportsController, AdminReportsController],
  providers: [ReportsService, ReportsQueueService],
  exports: [ReportsService]
})
export class ReportsModule {}
