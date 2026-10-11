export type PaymentInput = { referenceId: string; amount: number; currency: string };
export type PaymentResult = { provider: string; externalRef: string; status: "AWAITING_PAYMENT" | "PENDING_REVIEW" | "PAID" | "REFUNDED" };

export interface PaymentProvider {
  createPayment(input: PaymentInput): Promise<PaymentResult>;
  verifyPayment(input: { externalRef: string; reviewerId: string }): Promise<PaymentResult>;
  getPaymentStatus(input: { externalRef: string }): Promise<PaymentResult>;
  refundPayment(input: { externalRef: string }): Promise<PaymentResult>;
}

export class ManualTtProvider implements PaymentProvider {
  readonly name = "manual-tt";
  async createPayment(input: PaymentInput): Promise<PaymentResult> {
    return { provider: this.name, externalRef: `TT-${input.referenceId}`, status: "AWAITING_PAYMENT" };
  }
  async verifyPayment(input: { externalRef: string }): Promise<PaymentResult> {
    return { provider: this.name, externalRef: input.externalRef, status: "PAID" };
  }
  async getPaymentStatus(input: { externalRef: string }): Promise<PaymentResult> {
    return { provider: this.name, externalRef: input.externalRef, status: "PENDING_REVIEW" };
  }
  async refundPayment(input: { externalRef: string }): Promise<PaymentResult> {
    return { provider: this.name, externalRef: input.externalRef, status: "REFUNDED" };
  }
}
