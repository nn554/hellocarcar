import { Inject, Injectable } from "@nestjs/common";
import type { TelegramBotActionInput } from "@hellocarcar/contracts";
import { AuthService } from "../auth/auth.service";
import { DecisionsService } from "../decisions/decisions.service";
import { PaymentsService } from "../payments/payments.service";
import { ReportsService } from "../reports/reports.service";
import { ShippingService } from "../shipping/shipping.service";
import { SuppliersService } from "../suppliers/suppliers.service";

@Injectable()
export class BotGatewayService {
  constructor(
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(DecisionsService) private readonly decisions: DecisionsService,
    @Inject(SuppliersService) private readonly suppliers: SuppliersService,
    @Inject(ShippingService) private readonly shipping: ShippingService,
    @Inject(PaymentsService) private readonly payments: PaymentsService,
    @Inject(ReportsService) private readonly reports: ReportsService
  ) {}

  async execute(input: TelegramBotActionInput, secret?: string) {
    const user = await this.auth.resolveTelegramUser(input.telegramUserId, secret);
    switch (input.action) {
      case "DECISION": return this.decisions.create(user, { marketCode: "DZ", locale: input.locale, question: input.question });
      case "SUPPLIERS": return this.suppliers.recommend(user, { marketCode: "DZ", query: input.query, limit: 5 });
      case "SHIPPING": return this.shipping.quote(user, { marketCode: "DZ", originPort: input.originPort, destinationPort: input.destinationPort, containerType: input.containerType });
      case "PAYMENT_DESTINATIONS": return this.payments.listDestinations();
      case "CREATE_PAYMENT_ORDER": return this.payments.createOrder(user, { marketCode: "DZ", plan: input.plan, currency: input.currency, destinationId: input.destinationId });
      case "PAYMENT_ORDERS": return this.payments.listOrders(user);
      case "REPORTS": return this.reports.list(user);
      case "CREATE_REPORT": return this.reports.create(user, { marketCode: "DZ", locale: input.locale, reportType: input.reportType, scope: input.scope });
      case "REPORT_DOWNLOAD": return this.reports.download(user, input.reportId);
    }
  }
}
