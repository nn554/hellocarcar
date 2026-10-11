import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { prisma, runTrustedDataExpirySweep } from "@hellocarcar/db";
import { connectors } from "./connectors";
import { processWorkerJob } from "./job-handler";
import { createReportGenerator } from "./report-generator";
import { createNotificationSender, dispatchNotifications } from "./notification-dispatcher";
import { runDailyPolicyFetch } from "./policy-fetcher";

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });
const generateReportPdf = createReportGenerator(prisma);
const notificationSender = createNotificationSender();

const worker = new Worker("hellocarcar", (job) => processWorkerJob(job, {
  connectors,
  runExpirySweep: (data) => runTrustedDataExpirySweep(prisma, data),
  generateReportPdf,
  dispatchNotifications: () => dispatchNotifications(prisma, notificationSender),
  fetchPolicyNews: () => runDailyPolicyFetch(prisma)
}), { connection });

const queue = new Queue("hellocarcar", { connection });
void queue.upsertJobScheduler(
  "trusted-data-expiry-hourly",
  { every: 60 * 60 * 1_000 },
  { name: "trusted-data-expiry-sweep", data: {}, opts: { removeOnComplete: 100, removeOnFail: 100 } }
).catch((error) => console.error("Failed to register trusted-data expiry scheduler", error));
void queue.upsertJobScheduler(
  "notification-dispatch-30s",
  { every: 30_000 },
  { name: "notification-dispatch", data: {}, opts: { removeOnComplete: 100, removeOnFail: 100 } }
).catch((error) => console.error("Failed to register notification scheduler", error));

if (process.env.POLICY_FETCH_ENABLED !== "false") {
  void queue.upsertJobScheduler(
    "policy-news-daily",
    { pattern: process.env.POLICY_FETCH_CRON || "0 6 * * *", tz: process.env.POLICY_FETCH_TIMEZONE || "Africa/Algiers" },
    { name: "policy-news-daily-fetch", data: {}, opts: { attempts: 2, backoff: { type: "exponential", delay: 60_000 }, removeOnComplete: 100, removeOnFail: 100 } }
  ).catch((error) => console.error("Failed to register policy-news scheduler", error));

  if (process.env.POLICY_FETCH_RUN_ON_STARTUP === "true") {
    void queue.add("policy-news-daily-fetch", {}, { jobId: `policy-news-startup-${new Date().toISOString().slice(0, 10)}`, removeOnComplete: 100, removeOnFail: 100 })
      .catch((error) => console.error("Failed to enqueue startup policy-news fetch", error));
  }
}

worker.on("completed", (job) => console.log(`Completed ${job.name}:${job.id}`));
worker.on("failed", (job, error) => console.error(`Failed ${job?.name}:${job?.id}`, error.message));

console.log("HelloCarCar worker listening on queue hellocarcar");
