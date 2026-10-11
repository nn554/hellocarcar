import { describe, expect, it } from "vitest";
import {
  TELEGRAM_CALLBACK_DATA_MAX_BYTES,
  callbackData,
  paymentConfirmationCallback,
  paymentSelectionCallback
} from "../src/callback-data";

describe("Telegram callback data", () => {
  it("keeps payment callbacks within Telegram's 64-byte limit", () => {
    const destinationId = "cm12345678901234567890123";
    const callbacks = [
      paymentSelectionCallback("MONTHLY", "USD", destinationId),
      paymentSelectionCallback("ANNUAL", "HKD", destinationId),
      paymentConfirmationCallback("MONTHLY", "CNY", destinationId),
      paymentConfirmationCallback("ANNUAL", "USD", destinationId)
    ];

    expect(callbacks.every((value) => Buffer.byteLength(value, "utf8") <= TELEGRAM_CALLBACK_DATA_MAX_BYTES)).toBe(true);
  });

  it("rejects callback data over Telegram's limit", () => {
    expect(() => callbackData("x".repeat(TELEGRAM_CALLBACK_DATA_MAX_BYTES + 1))).toThrow(RangeError);
  });
});
