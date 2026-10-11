import { prisma } from "@hellocarcar/db";
import { describe, expect, it, vi } from "vitest";
import { dispatchNotifications, notificationMessage, type NotificationSender } from "../src/notification-dispatcher";

describe("notification outbox dispatcher", () => {
  it("atomically sends pending notifications and records terminal failures", async () => {
    const runId = Date.now().toString();
    const user = await prisma.user.create({ data: { email: `notification-${runId}@example.com`, emailVerifiedAt: new Date() } });
    const success = await prisma.notification.create({
      data: {
        userId: user.id,
        channel: "EMAIL",
        type: "REPORT_READY",
        recipient: user.email,
        payload: { reportId: `report-${runId}` },
        dedupeKey: `notification-success-${runId}`
      }
    });
    const terminal = await prisma.notification.create({
      data: {
        userId: user.id,
        channel: "TELEGRAM",
        type: "PAYMENT_PAID",
        recipient: runId,
        payload: { publicReference: `HCC-${runId}` },
        dedupeKey: `notification-failure-${runId}`
      }
    });
    const sender: NotificationSender = {
      send: vi.fn(async (notification) => {
        if (notification.id === terminal.id) throw new Error("simulated Telegram outage");
      })
    };
    try {
      const result = await dispatchNotifications(prisma, sender, { maxAttempts: 1 });
      expect(result).toEqual({ scanned: 2, sent: 1, retried: 0, failed: 1 });
      const rows = await prisma.notification.findMany({ where: { id: { in: [success.id, terminal.id] } } });
      expect(rows.find((item) => item.id === success.id)).toMatchObject({ status: "SENT", attempts: 1, lastError: null });
      expect(rows.find((item) => item.id === terminal.id)).toMatchObject({ status: "FAILED", attempts: 1, lastError: "simulated Telegram outage" });
      expect(notificationMessage(success).text).toContain(`/account/reports?report=report-${runId}`);
    } finally {
      await prisma.notification.deleteMany({ where: { id: { in: [success.id, terminal.id] } } });
      await prisma.user.delete({ where: { id: user.id } });
    }
  });
});
