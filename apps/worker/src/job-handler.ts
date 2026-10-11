import type { Job } from "bullmq";
import type { ExpirySweepResult } from "@hellocarcar/db";
import type { connectors } from "./connectors";

type ConnectorMap = typeof connectors;
type WorkerJob = Pick<Job, "name" | "data">;

export type WorkerJobDependencies = {
  connectors: ConnectorMap;
  runExpirySweep: (data: { now?: Date; runId?: string }) => Promise<ExpirySweepResult>;
  generateReportPdf: (reportRequestId: string) => Promise<unknown>;
  dispatchNotifications: () => Promise<unknown>;
  fetchPolicyNews: () => Promise<unknown>;
};

export async function processWorkerJob(job: WorkerJob, dependencies: WorkerJobDependencies) {
  if (job.name === "sync-source") {
    const source = job.data.source === "nbs" ? "nbs" : "feishu";
    return dependencies.connectors[source].pull({ cursor: job.data.cursor ?? null });
  }
  if (job.name === "trusted-data-expiry-sweep") {
    const data = job.data as { now?: string; runId?: string };
    return dependencies.runExpirySweep({
      ...(data.now ? { now: new Date(data.now) } : {}),
      ...(data.runId ? { runId: data.runId } : {})
    });
  }
  if (job.name === "generate-report-pdf") {
    if (typeof job.data.reportRequestId !== "string" || !job.data.reportRequestId) throw new Error("reportRequestId is required");
    return dependencies.generateReportPdf(job.data.reportRequestId);
  }
  if (job.name === "notification-dispatch") return dependencies.dispatchNotifications();
  if (job.name === "policy-news-daily-fetch") return dependencies.fetchPolicyNews();
  if (["generate-decision", "send-email"].includes(job.name)) {
    return { status: "ADAPTER_NOT_CONFIGURED", job: job.name };
  }
  throw new Error(`Unknown job: ${job.name}`);
}
