import { describe, expect, it, vi } from "vitest";
import { connectors } from "../src/connectors";
import { processWorkerJob } from "../src/job-handler";

describe("worker job handler", () => {
  it("routes the scheduled expiry job to the shared sweep service", async () => {
    const result = {
      runId: "worker-expiry-test",
      scannedAt: "2026-07-23T10:00:00.000Z",
      expired: { evidence: 1, policies: 1, priceObservations: 1, total: 3 },
      reviewTasksCreated: 3
    };
    const runExpirySweep = vi.fn().mockResolvedValue(result);

    await expect(processWorkerJob({
      name: "trusted-data-expiry-sweep",
      data: { now: result.scannedAt, runId: result.runId }
    } as never, { connectors, runExpirySweep, generateReportPdf: vi.fn(), dispatchNotifications: vi.fn(), fetchPolicyNews: vi.fn() })).resolves.toEqual(result);

    expect(runExpirySweep).toHaveBeenCalledWith({
      now: new Date(result.scannedAt),
      runId: result.runId
    });
  });

  it("routes PDF jobs to the report generator", async () => {
    const generateReportPdf = vi.fn().mockResolvedValue({ status: "GENERATED", version: 1 });
    await expect(processWorkerJob({
      name: "generate-report-pdf",
      data: { reportRequestId: "report-123" }
    } as never, { connectors, runExpirySweep: vi.fn(), generateReportPdf, dispatchNotifications: vi.fn(), fetchPolicyNews: vi.fn() })).resolves.toEqual({ status: "GENERATED", version: 1 });
    expect(generateReportPdf).toHaveBeenCalledWith("report-123");
  });

  it("routes scheduled notification jobs to the outbox dispatcher", async () => {
    const dispatchNotifications = vi.fn().mockResolvedValue({ scanned: 2, sent: 2, retried: 0, failed: 0 });
    await expect(processWorkerJob({ name: "notification-dispatch", data: {} } as never, {
      connectors,
      runExpirySweep: vi.fn(),
      generateReportPdf: vi.fn(),
      dispatchNotifications,
      fetchPolicyNews: vi.fn()
    })).resolves.toEqual({ scanned: 2, sent: 2, retried: 0, failed: 0 });
    expect(dispatchNotifications).toHaveBeenCalledOnce();
  });

  it("routes daily policy discovery to the official-source fetcher", async () => {
    const fetchPolicyNews = vi.fn().mockResolvedValue({ status: "SUCCEEDED", drafted: 2 });
    await expect(processWorkerJob({ name: "policy-news-daily-fetch", data: {} } as never, {
      connectors,
      runExpirySweep: vi.fn(),
      generateReportPdf: vi.fn(),
      dispatchNotifications: vi.fn(),
      fetchPolicyNews
    })).resolves.toEqual({ status: "SUCCEEDED", drafted: 2 });
    expect(fetchPolicyNews).toHaveBeenCalledOnce();
  });
});
