import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { DatabaseModule } from "./database/database.module";
import { AuthModule } from "./auth/auth.module";
import { SessionGuard } from "./auth/session.guard";
import { RolesGuard } from "./auth/roles.guard";
import { MarketsModule } from "./markets/markets.module";
import { VehiclesModule } from "./vehicles/vehicles.module";
import { DecisionsModule } from "./decisions/decisions.module";
import { ReportsModule } from "./reports/reports.module";
import { OrdersModule } from "./orders/orders.module";
import { HealthController } from "./health.controller";
import { TrustedDataModule } from "./trusted-data/trusted-data.module";
import { ReviewTasksModule } from "./review-tasks/review-tasks.module";
import { SuppliersModule } from "./suppliers/suppliers.module";
import { ShippingModule } from "./shipping/shipping.module";
import { PaymentsModule } from "./payments/payments.module";
import { BotGatewayModule } from "./bot-gateway/bot-gateway.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: [".env.local", ".env"] }),
    DatabaseModule,
    AuthModule,
    MarketsModule,
    VehiclesModule,
    DecisionsModule,
    ReportsModule,
    OrdersModule,
    TrustedDataModule,
    ReviewTasksModule,
    SuppliersModule,
    ShippingModule,
    PaymentsModule,
    BotGatewayModule
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: SessionGuard },
    { provide: APP_GUARD, useClass: RolesGuard }
  ]
})
export class AppModule {}
