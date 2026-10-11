import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { DecisionsModule } from "../decisions/decisions.module";
import { PaymentsModule } from "../payments/payments.module";
import { ReportsModule } from "../reports/reports.module";
import { ShippingModule } from "../shipping/shipping.module";
import { SuppliersModule } from "../suppliers/suppliers.module";
import { BotGatewayController } from "./bot-gateway.controller";
import { BotGatewayService } from "./bot-gateway.service";

@Module({ imports: [AuthModule, DecisionsModule, SuppliersModule, ShippingModule, PaymentsModule, ReportsModule], controllers: [BotGatewayController], providers: [BotGatewayService] })
export class BotGatewayModule {}
