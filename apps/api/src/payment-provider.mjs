export class ManualTtProvider {
  name = "manual-tt";

  async createPayment({ reportId, amount, currency }) {
    return { provider: this.name, externalRef: `TT-${reportId}`, status: "AWAITING_PAYMENT", amount, currency };
  }

  async verifyPayment({ proofId, reviewerId }) {
    return { provider: this.name, proofId, verifiedBy: reviewerId, status: "PAID" };
  }

  async getPaymentStatus({ externalRef }) {
    return { provider: this.name, externalRef, status: "PENDING_REVIEW" };
  }

  async refundPayment({ externalRef }) {
    return { provider: this.name, externalRef, status: "REFUNDED" };
  }
}
