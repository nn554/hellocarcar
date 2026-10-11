import { Body, Controller, Get, Inject, Param, Patch, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { createExchangeRateSchema, createPaymentDestinationSchema, reviewPaymentOrderSchema, reviewRefundSchema, updatePaymentDestinationSchema, updateSubscriptionSchema, type SessionUser } from "@hellocarcar/contracts";
import { CurrentUser, Roles } from "../common/decorators";
import { parseWithSchema } from "../common/zod";
import { PaymentsService } from "./payments.service";
import { StatementImportService } from "./statement-import.service";

@Controller("v1/admin/payments")
@Roles("FINANCE", "ADMIN")
export class AdminPaymentsController {
  constructor(
    @Inject(PaymentsService) private readonly payments: PaymentsService,
    @Inject(StatementImportService) private readonly statements: StatementImportService
  ) {}

  @Post("destinations")
  destination(@CurrentUser() user: SessionUser, @Body() body: unknown) {
    return this.payments.createDestination(user, parseWithSchema(createPaymentDestinationSchema, body));
  }

  @Get("destinations")
  destinations() { return this.payments.listAdminDestinations(); }

  @Patch("destinations/:id")
  updateDestination(@CurrentUser() user: SessionUser, @Param("id") id: string, @Body() body: unknown) {
    return this.payments.updateDestination(user, id, parseWithSchema(updatePaymentDestinationSchema, body));
  }

  @Post("exchange-rates")
  rate(@CurrentUser() user: SessionUser, @Body() body: unknown) {
    return this.payments.createExchangeRate(user, parseWithSchema(createExchangeRateSchema, body));
  }

  @Get("exchange-rates")
  rates() { return this.payments.listExchangeRates(); }

  @Get("orders")
  orders() { return this.payments.listAdminOrders(); }

  @Get("orders/:orderId/proofs/:proofId/download")
  proofDownload(@Param("orderId") orderId: string, @Param("proofId") proofId: string) {
    return this.payments.adminProofDownload(orderId, proofId);
  }

  @Get("statement-imports")
  statementImports() { return this.statements.list(); }

  @Post("destinations/:destinationId/statement-imports")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 10 * 1024 * 1024, files: 1 } }))
  statementImport(@CurrentUser() user: SessionUser, @Param("destinationId") destinationId: string, @UploadedFile() file: Express.Multer.File) {
    return this.statements.import(user, destinationId, file);
  }

  @Patch("orders/:id/review")
  review(@CurrentUser() user: SessionUser, @Param("id") id: string, @Body() body: unknown) {
    return this.payments.reviewOrder(user, id, parseWithSchema(reviewPaymentOrderSchema, body));
  }

  @Patch("refunds/:id")
  refund(@CurrentUser() user: SessionUser, @Param("id") id: string, @Body() body: unknown) {
    return this.payments.reviewRefund(user, id, parseWithSchema(reviewRefundSchema, body));
  }

  @Get("refunds")
  refunds() { return this.payments.listRefunds(); }

  @Get("subscriptions")
  subscriptions() { return this.payments.listSubscriptions(); }

  @Patch("subscriptions/:id")
  subscription(@CurrentUser() user: SessionUser, @Param("id") id: string, @Body() body: unknown) {
    return this.payments.updateSubscription(user, id, parseWithSchema(updateSubscriptionSchema, body));
  }
}
