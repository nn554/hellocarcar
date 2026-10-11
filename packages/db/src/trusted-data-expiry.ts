import { PrismaClient, ReviewTaskType } from "@prisma/client";

export type ExpirySweepResult = {
  runId: string;
  scannedAt: string;
  expired: {
    evidence: number;
    policies: number;
    priceObservations: number;
    total: number;
  };
  reviewTasksCreated: number;
};

type ExpiryTarget = {
  entityType: "Evidence" | "CountryPolicy" | "PriceObservation";
  entityId: string;
  marketIds: Array<string | null>;
  taskType: ReviewTaskType;
  reason: string;
};

const uniqueValues = <T>(values: T[]) => [...new Set(values)];

/**
 * Expires only verified records. Each state transition, task upsert and audit
 * event is committed together, so a retry cannot leave a half-processed fact.
 */
export async function runTrustedDataExpirySweep(
  client: PrismaClient,
  options: { now?: Date; runId?: string } = {}
): Promise<ExpirySweepResult> {
  const now = options.now ?? new Date();
  const runId = options.runId ?? `expiry-sweep-${now.getTime()}-${Math.random().toString(36).slice(2, 10)}`;
  const candidates: ExpiryTarget[] = [];

  const evidence = await client.evidence.findMany({
    where: { reviewState: "VERIFIED", validUntil: { not: null, lte: now } },
    select: {
      id: true,
      marketId: true,
      links: {
        select: {
          priceObservation: { select: { marketId: true } },
          supplierMarketCapability: { select: { marketId: true } },
          countryPolicy: { select: { marketId: true } },
          vehicleMarketEligibility: { select: { marketId: true } }
        }
      }
    }
  });
  for (const record of evidence) {
    const linkedMarketIds = record.links.flatMap((link) => [
      link.priceObservation?.marketId,
      link.supplierMarketCapability?.marketId,
      link.countryPolicy?.marketId,
      link.vehicleMarketEligibility?.marketId
    ]).filter((marketId): marketId is string => Boolean(marketId));
    candidates.push({
      entityType: "Evidence",
      entityId: record.id,
      marketIds: uniqueValues(record.marketId ? [record.marketId] : linkedMarketIds).length > 0
        ? uniqueValues(record.marketId ? [record.marketId] : linkedMarketIds)
        : [null],
      taskType: "EVIDENCE",
      reason: "VERIFIED_EVIDENCE_EXPIRED"
    });
  }

  const policies = await client.countryPolicy.findMany({
    where: { reviewState: "VERIFIED", expiresAt: { not: null, lte: now } },
    select: { id: true, marketId: true }
  });
  for (const record of policies) {
    candidates.push({ entityType: "CountryPolicy", entityId: record.id, marketIds: [record.marketId], taskType: "POLICY", reason: "VERIFIED_POLICY_EXPIRED" });
  }

  const prices = await client.priceObservation.findMany({
    where: { reviewState: "VERIFIED", validUntil: { not: null, lte: now } },
    select: { id: true, marketId: true }
  });
  for (const record of prices) {
    candidates.push({ entityType: "PriceObservation", entityId: record.id, marketIds: [record.marketId], taskType: "PRICE_OBSERVATION", reason: "VERIFIED_PRICE_OBSERVATION_EXPIRED" });
  }

  const expired = { evidence: 0, policies: 0, priceObservations: 0 };
  let reviewTasksCreated = 0;

  for (const candidate of candidates) {
    const processed = await client.$transaction(async (tx) => {
      const where = { id: candidate.entityId, reviewState: "VERIFIED" as const };
      const update = candidate.entityType === "Evidence"
        ? await tx.evidence.updateMany({ where: { ...where, validUntil: { not: null, lte: now } }, data: { reviewState: "EXPIRED" } })
        : candidate.entityType === "CountryPolicy"
          ? await tx.countryPolicy.updateMany({ where: { ...where, expiresAt: { not: null, lte: now } }, data: { reviewState: "EXPIRED" } })
          : await tx.priceObservation.updateMany({ where: { ...where, validUntil: { not: null, lte: now } }, data: { reviewState: "EXPIRED" } });

      if (update.count === 0) return { changed: false, taskCount: 0 };

      const taskIds: string[] = [];
      for (const marketId of candidate.marketIds) {
        const dedupeKey = `expiry:${candidate.entityType}:${candidate.entityId}:${marketId ?? "global"}`;
        const task = await tx.reviewTask.upsert({
          where: { dedupeKey },
          create: {
            marketId,
            type: candidate.taskType,
            entityType: candidate.entityType,
            entityId: candidate.entityId,
            reason: candidate.reason,
            dedupeKey
          },
          update: {}
        });
        taskIds.push(task.id);
      }
      await tx.auditLog.create({
        data: {
          action: "TRUSTED_DATA_AUTO_EXPIRED",
          entityType: candidate.entityType,
          entityId: candidate.entityId,
          metadata: { runId, taskIds, expiredAt: now.toISOString(), reason: candidate.reason }
        }
      });
      return { changed: true, taskCount: taskIds.length };
    });

    if (!processed.changed) continue;
    reviewTasksCreated += processed.taskCount;
    if (candidate.entityType === "Evidence") expired.evidence += 1;
    if (candidate.entityType === "CountryPolicy") expired.policies += 1;
    if (candidate.entityType === "PriceObservation") expired.priceObservations += 1;
  }

  const result: ExpirySweepResult = {
    runId,
    scannedAt: now.toISOString(),
    expired: { ...expired, total: expired.evidence + expired.policies + expired.priceObservations },
    reviewTasksCreated
  };
  await client.auditLog.create({
    data: {
      action: "TRUSTED_DATA_EXPIRY_SWEEP_COMPLETED",
      entityType: "ExpirySweep",
      entityId: runId,
      metadata: result
    }
  });
  return result;
}
