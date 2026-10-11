import { prisma, runTrustedDataExpirySweep } from "@hellocarcar/db";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

describe("trusted-data expiry sweep", () => {
  const runId = `expiry-db-${Date.now()}`;
  const firstSweepId = `${runId}-first`;
  const secondSweepId = `${runId}-second`;
  const now = new Date("2026-07-23T10:00:00.000Z");
  const expiredAt = new Date("2026-07-22T10:00:00.000Z");
  const futureAt = new Date("2026-07-24T10:00:00.000Z");
  let marketId = "";
  let reviewerId = "";
  let vehicleId = "";
  const entityIds: string[] = [];

  beforeAll(async () => {
    const [market, reviewer] = await Promise.all([
      prisma.market.findUniqueOrThrow({ where: { code: "DZ" } }),
      prisma.user.findUniqueOrThrow({ where: { email: "reviewer@hellocarcar.local" } })
    ]);
    marketId = market.id;
    reviewerId = reviewer.id;

    const vehicle = await prisma.vehicleModel.create({
      data: { make: runId, name: "Expiry sweep test vehicle", modelYear: 2026, energyType: "BEV", bodyType: "SUV", seats: 5 }
    });
    vehicleId = vehicle.id;

    const expiredEvidence = await prisma.evidence.create({
      data: {
        marketId,
        scope: "MARKET",
        kind: "EXPIRY_TEST",
        title: "Expired verified evidence",
        sourceSystem: "MANUAL",
        sourceRef: `${runId}:expired-evidence`,
        observedAt: new Date("2026-07-20T10:00:00.000Z"),
        validUntil: expiredAt,
        reviewState: "VERIFIED",
        reviewedById: reviewerId,
        reviewedAt: new Date("2026-07-21T10:00:00.000Z"),
        contentHash: `${runId}:expired`
      }
    });
    const futureEvidence = await prisma.evidence.create({
      data: {
        marketId,
        scope: "MARKET",
        kind: "EXPIRY_TEST",
        title: "Current verified evidence",
        sourceSystem: "MANUAL",
        sourceRef: `${runId}:future-evidence`,
        observedAt: new Date("2026-07-20T10:00:00.000Z"),
        validUntil: futureAt,
        reviewState: "VERIFIED",
        reviewedById: reviewerId,
        reviewedAt: new Date("2026-07-21T10:00:00.000Z"),
        contentHash: `${runId}:future`
      }
    });
    const draftEvidence = await prisma.evidence.create({
      data: {
        marketId,
        scope: "MARKET",
        kind: "EXPIRY_TEST",
        title: "Expired draft evidence",
        sourceSystem: "MANUAL",
        sourceRef: `${runId}:draft-evidence`,
        observedAt: new Date("2026-07-20T10:00:00.000Z"),
        validUntil: expiredAt,
        reviewState: "DRAFT",
        contentHash: `${runId}:draft`
      }
    });
    const policy = await prisma.countryPolicy.create({
      data: {
        marketId,
        category: "EXPIRY_TEST",
        title: runId,
        summary: "Database-only automatic expiry coverage.",
        effectiveAt: new Date("2026-07-20T10:00:00.000Z"),
        expiresAt: expiredAt,
        sourceUrl: "https://example.com/expiry-test",
        reviewState: "VERIFIED",
        reviewedById: reviewerId,
        reviewedAt: new Date("2026-07-21T10:00:00.000Z")
      }
    });
    const price = await prisma.priceObservation.create({
      data: {
        marketId,
        vehicleModelId: vehicleId,
        amount: 12345,
        currency: "USD",
        incoterm: "FOB",
        observedAt: new Date("2026-07-20T10:00:00.000Z"),
        validUntil: expiredAt,
        reviewState: "VERIFIED",
        sourceSystem: "MANUAL",
        sourceRef: `${runId}:price`,
        reviewedById: reviewerId,
        reviewedAt: new Date("2026-07-21T10:00:00.000Z")
      }
    });
    entityIds.push(expiredEvidence.id, futureEvidence.id, draftEvidence.id, policy.id, price.id);
  });

  afterAll(async () => {
    const tasks = await prisma.reviewTask.findMany({ where: { entityId: { in: entityIds } }, select: { id: true } });
    await prisma.reviewTask.deleteMany({ where: { id: { in: tasks.map((task) => task.id) } } });
    await prisma.auditLog.deleteMany({
      where: { OR: [{ entityId: { in: entityIds } }, { entityType: "ExpirySweep", entityId: { in: [firstSweepId, secondSweepId] } }] }
    });
    await prisma.priceObservation.deleteMany({ where: { id: { in: entityIds } } });
    await prisma.countryPolicy.deleteMany({ where: { id: { in: entityIds } } });
    await prisma.evidence.deleteMany({ where: { id: { in: entityIds } } });
    if (vehicleId) await prisma.vehicleModel.delete({ where: { id: vehicleId } });
    await prisma.$disconnect();
  });

  it("expires verified facts once and creates one deduplicated market task per fact", async () => {
    const first = await runTrustedDataExpirySweep(prisma, { now, runId: firstSweepId });
    expect(first).toMatchObject({
      expired: { evidence: 1, policies: 1, priceObservations: 1, total: 3 },
      reviewTasksCreated: 3
    });

    const states = await Promise.all([
      prisma.evidence.findUniqueOrThrow({ where: { id: entityIds[0] }, select: { reviewState: true } }),
      prisma.evidence.findUniqueOrThrow({ where: { id: entityIds[1] }, select: { reviewState: true } }),
      prisma.evidence.findUniqueOrThrow({ where: { id: entityIds[2] }, select: { reviewState: true } }),
      prisma.countryPolicy.findUniqueOrThrow({ where: { id: entityIds[3] }, select: { reviewState: true } }),
      prisma.priceObservation.findUniqueOrThrow({ where: { id: entityIds[4] }, select: { reviewState: true } })
    ]);
    expect(states.map((record) => record.reviewState)).toEqual(["EXPIRED", "VERIFIED", "DRAFT", "EXPIRED", "EXPIRED"]);

    const tasks = await prisma.reviewTask.findMany({ where: { entityId: { in: entityIds } }, orderBy: { entityType: "asc" } });
    expect(tasks).toHaveLength(3);
    expect(tasks.every((task) => task.marketId === marketId && task.dedupeKey?.startsWith("expiry:"))).toBe(true);

    const second = await runTrustedDataExpirySweep(prisma, { now, runId: secondSweepId });
    expect(second.expired.total).toBe(0);
    expect(second.reviewTasksCreated).toBe(0);
    expect(await prisma.reviewTask.count({ where: { entityId: { in: entityIds } } })).toBe(3);

    expect(await prisma.auditLog.count({ where: { action: "TRUSTED_DATA_AUTO_EXPIRED", entityId: { in: entityIds } } })).toBe(3);
    expect(await prisma.auditLog.count({ where: { action: "TRUSTED_DATA_EXPIRY_SWEEP_COMPLETED", entityId: { in: [firstSweepId, secondSweepId] } } })).toBe(2);
  });
});
