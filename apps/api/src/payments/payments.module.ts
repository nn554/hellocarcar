import { Module } from "@nestjs/common";
import { ObjectStorageModule } from "../storage/object-storage.module";
import { AdminPaymentsController } from "./admin-payments.controller";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { StatementImportService } from "./statement-import.service";

@Module({ imports: [ObjectStorageModule], controllers: [PaymentsController, AdminPaymentsController], providers: [PaymentsService, StatementImportService], exports: [PaymentsService] })
export class PaymentsModule {}
