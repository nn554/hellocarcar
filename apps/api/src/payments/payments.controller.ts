import { Body, Controller, Get, Inject, Param, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { createPaymentOrderSchema, requestRefundSchema, type SessionUser } from "@hellocarcar/contracts";
import { CurrentUser } from "../common/decorators";
import { parseWithSchema } from "../common/zod";
import { PaymentsService } from "./payments.service";

@Controller("v1/payments")
export class PaymentsController {
  constructor(@Inject(PaymentsService) private readonly payments: PaymentsService) {}

  @Get("destinations")
  destinations() { return this.payments.listDestinations(); }

  @Post("orders")
  createOrder(@CurrentUser() user: SessionUser, @Body() body: unknown) {
    const input = parseWithSchema(createPaymentOrderSchema, body);
    return this.payments.createOrder(user, { ...input, marketCode: input.marketCode ?? "DZ" });
  }

  @Get("orders")
  orders(@CurrentUser() user: SessionUser) { return this.payments.listOrders(user); }

  @Get("orders/:id")
  order(@CurrentUser() user: SessionUser, @Param("id") id: string) { return this.payments.getOrder(user, id); }

  @Post("orders/:id/proofs")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 10 * 1024 * 1024, files: 1 } }))
  proof(@CurrentUser() user: SessionUser, @Param("id") id: string, @UploadedFile() file: Express.Multer.File) {
    return this.payments.submitProof(user, id, file);
  }

  @Get("orders/:orderId/proofs/:proofId/download")
  proofDownload(@CurrentUser() user: SessionUser, @Param("orderId") orderId: string, @Param("proofId") proofId: string) {
    return this.payments.proofDownload(user, orderId, proofId);
  }

  @Post("orders/:id/refunds")
  requestRefund(@CurrentUser() user: SessionUser, @Param("id") id: string, @Body() body: unknown) {
    return this.payments.requestRefund(user, id, parseWithSchema(requestRefundSchema, body));
  }
}
