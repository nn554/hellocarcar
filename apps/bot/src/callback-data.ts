export const TELEGRAM_CALLBACK_DATA_MAX_BYTES = 64;

export function callbackData(value: string) {
  if (Buffer.byteLength(value, "utf8") > TELEGRAM_CALLBACK_DATA_MAX_BYTES) {
    throw new RangeError("Telegram callback data exceeds 64 bytes");
  }
  return value;
}

export function paymentSelectionCallback(plan: "MONTHLY" | "ANNUAL", currency: "USD" | "CNY" | "HKD", destinationId: string) {
  return callbackData(`pay_select_${plan}_${currency}_${destinationId}`);
}

export function paymentConfirmationCallback(plan: "MONTHLY" | "ANNUAL", currency: "USD" | "CNY" | "HKD", destinationId: string) {
  return callbackData(`pay_confirm_${plan}_${currency}_${destinationId}`);
}
