import type { PrismaClient } from "@hellocarcar/db";
import nodemailer, { type Transporter } from "nodemailer";

type NotificationMessage = { subject: string; text: string };
type DispatchableNotification = {
  id: string;
  channel: "TELEGRAM" | "EMAIL" | "ADMIN";
  type: string;
  recipient: string;
  payload: unknown;
  attempts: number;
  user: { telegramIdentity: { languageCode: string | null } | null } | null;
};

export interface NotificationSender {
  send(notification: DispatchableNotification): Promise<void>;
}

function payloadObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export function notificationMessage(notification: Pick<DispatchableNotification, "type" | "payload">): NotificationMessage {
  const payload = payloadObject(notification.payload);
  const webOrigin = (process.env.WEB_ORIGIN || "http://127.0.0.1:4173").replace(/\/$/, "");
  if (notification.type === "REPORT_READY") {
    return {
      subject: "Your HelloCarCar report is ready",
      text: `Your report is ready. Open the secure workspace to download it: ${webOrigin}/dz/ar/account/reports${payload.reportId ? `?report=${payload.reportId}` : ""}`
    };
  }
  if (notification.type === "PAYMENT_PAID") {
    return {
      subject: "HelloCarCar payment approved",
      text: `Payment ${String(payload.publicReference || "")} was approved and the subscription is active. Open: ${webOrigin}/dz/ar/account/payments`
    };
  }
  if (notification.type === "PAYMENT_NEEDS_SUPPLEMENT") {
    return {
      subject: "More payment information is required",
      text: `Payment ${String(payload.publicReference || "")} needs additional evidence. Open: ${webOrigin}/dz/ar/account/payments`
    };
  }
  if (notification.type === "PAYMENT_REJECTED") {
    return {
      subject: "HelloCarCar payment review result",
      text: `Payment ${String(payload.publicReference || "")} was not approved. Open the secure workspace for the review result: ${webOrigin}/dz/ar/account/payments`
    };
  }
  return { subject: "HelloCarCar update", text: `There is a new update in your secure workspace: ${webOrigin}/dz/ar/account` };
}

export function createNotificationSender(): NotificationSender {
  let transporter: Transporter | undefined;
  const mailTransport = () => transporter ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST || "127.0.0.1",
    port: Number(process.env.SMTP_PORT || 1025),
    secure: Number(process.env.SMTP_PORT || 1025) === 465,
    ...(process.env.SMTP_USER ? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD || "" } } : {})
  });

  return {
    async send(notification) {
      if (notification.channel === "ADMIN") return;
      const message = notificationMessage(notification);
      if (notification.channel === "EMAIL") {
        if ((process.env.EMAIL_DELIVERY_MODE || "console") === "console") {
          console.log(`[notification email] ${notification.recipient}: ${message.subject}`);
          return;
        }
        await mailTransport().sendMail({
          from: process.env.SMTP_FROM || "HelloCarCar <no-reply@hellocarcar.local>",
          to: notification.recipient,
          subject: message.subject,
          text: message.text
        });
        return;
      }
      const token = process.env.TELEGRAM_BOT_TOKEN;
      if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not configured");
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chat_id: notification.recipient, text: message.text, disable_web_page_preview: true })
      });
      if (!response.ok) {
        const details = await response.text();
        throw new Error(`Telegram send failed (${response.status}): ${details.slice(0, 500)}`);
      }
    }
  };
}

export async function dispatchNotifications(
  prisma: PrismaClient,
  sender: NotificationSender,
  options: { now?: Date; limit?: number; maxAttempts?: number } = {}
) {
  const now = options.now ?? new Date();
  const limit = options.limit ?? 25;
  const maxAttempts = options.maxAttempts ?? 5;
  const staleBefore = new Date(now.getTime() - 10 * 60_000);
  await prisma.notification.updateMany({
    where: { status: "PROCESSING", processingAt: { lt: staleBefore }, attempts: { lt: maxAttempts } },
    data: { status: "PENDING", processingAt: null, scheduledAt: now, lastError: "Recovered stale notification claim" }
  });
  await prisma.notification.updateMany({
    where: { status: "PROCESSING", processingAt: { lt: staleBefore }, attempts: { gte: maxAttempts } },
    data: { status: "FAILED", processingAt: null, lastError: "Notification claim expired after maximum attempts" }
  });

  const candidates = await prisma.notification.findMany({
    where: { status: "PENDING", scheduledAt: { lte: now }, attempts: { lt: maxAttempts } },
    include: { user: { select: { telegramIdentity: { select: { languageCode: true } } } } },
    orderBy: [{ scheduledAt: "asc" }, { createdAt: "asc" }],
    take: limit
  });
  let sent = 0;
  let retried = 0;
  let failed = 0;
  for (const notification of candidates) {
    const claimed = await prisma.notification.updateMany({
      where: { id: notification.id, status: "PENDING", attempts: notification.attempts },
      data: { status: "PROCESSING", processingAt: now, attempts: { increment: 1 }, lastError: null }
    });
    if (claimed.count !== 1) continue;
    const attempt = notification.attempts + 1;
    try {
      await sender.send({ ...notification, attempts: attempt });
      await prisma.notification.update({
        where: { id: notification.id },
        data: { status: "SENT", sentAt: new Date(), processingAt: null, lastError: null }
      });
      sent += 1;
    } catch (error) {
      const terminal = attempt >= maxAttempts;
      const backoffSeconds = Math.min(30 * 2 ** (attempt - 1), 30 * 60);
      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: terminal ? "FAILED" : "PENDING",
          processingAt: null,
          scheduledAt: terminal ? now : new Date(now.getTime() + backoffSeconds * 1_000),
          lastError: (error instanceof Error ? error.message : "Unknown notification error").slice(0, 2000)
        }
      });
      if (terminal) failed += 1;
      else retried += 1;
    }
  }
  return { scanned: candidates.length, sent, retried, failed };
}
