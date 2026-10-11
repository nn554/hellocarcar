import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Prisma, prisma } from "@hellocarcar/db";

type EvidenceInput = {
  sourceRef: string;
  title: string;
  kind: string;
  sourceUrl: string;
  localPath: string;
  contentHash: string;
  originalLanguage: string;
  publishedAt: string | null;
  legalDate: string | null;
  legalReferences: string[];
};

type PolicyInput = {
  slug: string;
  category: string;
  title: string;
  summary: string;
  plainExplanation: string;
  steps: string[];
  requiredDocuments: string[];
  feesNote: string;
  effectiveAt: string;
  sourceUrl: string;
  evidenceSourceRefs: string[];
};

type BaselineManifest = {
  marketCode: string;
  route: string;
  vehicleScope: string;
  language: string;
  status: "DRAFT";
  observedAt: string;
  disclaimer: string;
  evidence: EvidenceInput[];
  policies: PolicyInput[];
};

const manifestPath = resolve(__dirname, "../../../outputs/policy-content/dz/baseline-policies.json");

async function importBaseline() {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as BaselineManifest;
  if (manifest.status !== "DRAFT") throw new Error("Baseline manifest must remain DRAFT");

  const market = await prisma.market.findUniqueOrThrow({ where: { code: manifest.marketCode } });
  const syncRun = await prisma.syncRun.create({
    data: { marketId: market.id, sourceSystem: "PUBLIC_SOURCE", cursor: `baseline:${manifest.observedAt}` }
  });
  const evidenceIds = new Map<string, string>();
  let rawCreated = 0;
  let evidenceCreated = 0;
  let policyCreated = 0;
  let policyUpdated = 0;
  let protectedPolicies = 0;

  try {
    for (const item of manifest.evidence) {
      const rawKey = `policy-baseline:${item.sourceRef}`;
      const rawWhere = {
        sourceSystem_sourceKey_contentHash: {
          sourceSystem: "PUBLIC_SOURCE" as const,
          sourceKey: rawKey,
          contentHash: item.contentHash
        }
      };
      let raw = await prisma.rawSourceRecord.findUnique({ where: rawWhere });
      if (!raw) {
        raw = await prisma.rawSourceRecord.create({
          data: {
            syncRunId: syncRun.id,
            marketId: market.id,
            sourceSystem: "PUBLIC_SOURCE",
            sourceKey: rawKey,
            contentHash: item.contentHash,
            payload: {
              title: item.title,
              sourceUrl: item.sourceUrl,
              localPath: item.localPath,
              originalLanguage: item.originalLanguage,
              publishedAt: item.publishedAt,
              legalDate: item.legalDate,
              legalReferences: item.legalReferences
            },
            appliedAt: new Date()
          }
        });
        rawCreated += 1;
      }

      const evidenceWhere = {
        sourceSystem_sourceRef_contentHash: {
          sourceSystem: "PUBLIC_SOURCE" as const,
          sourceRef: item.sourceRef,
          contentHash: item.contentHash
        }
      };
      let evidence = await prisma.evidence.findUnique({ where: evidenceWhere });
      if (!evidence) {
        evidence = await prisma.evidence.create({
          data: {
            marketId: market.id,
            scope: "MARKET",
            kind: item.kind,
            title: item.title,
            sourceSystem: "PUBLIC_SOURCE",
            sourceRef: item.sourceRef,
            sourceUrl: item.sourceUrl,
            observedAt: new Date(manifest.observedAt),
            reviewState: "DRAFT",
            contentHash: item.contentHash,
            metadata: {
              route: manifest.route,
              vehicleScope: manifest.vehicleScope,
              localPath: item.localPath,
              originalLanguage: item.originalLanguage,
              publishedAt: item.publishedAt,
              legalDate: item.legalDate,
              legalReferences: item.legalReferences,
              disclaimer: manifest.disclaimer
            }
          }
        });
        evidenceCreated += 1;
      }
      evidenceIds.set(item.sourceRef, evidence.id);
    }

    for (const item of manifest.policies) {
      const linkedEvidenceIds = item.evidenceSourceRefs.map((sourceRef) => {
        const id = evidenceIds.get(sourceRef);
        if (!id) throw new Error(`Evidence sourceRef not found: ${sourceRef}`);
        return id;
      });
      await prisma.$transaction(async (tx) => {
        const existing = await tx.countryPolicy.findFirst({
          where: { marketId: market.id, title: item.title, sourceUrl: item.sourceUrl }
        });
        if (existing && existing.reviewState !== "DRAFT") {
          protectedPolicies += 1;
          return;
        }
        const data = {
          marketId: market.id,
          category: item.category,
          title: item.title,
          summary: item.summary,
          plainExplanation: item.plainExplanation,
          steps: item.steps as Prisma.InputJsonValue,
          requiredDocuments: item.requiredDocuments as Prisma.InputJsonValue,
          feesNote: item.feesNote,
          effectiveAt: new Date(item.effectiveAt),
          expiresAt: null,
          sourceUrl: item.sourceUrl,
          reviewState: "DRAFT" as const
        };
        const policy = existing
          ? await tx.countryPolicy.update({ where: { id: existing.id }, data })
          : await tx.countryPolicy.create({ data });
        if (existing) policyUpdated += 1;
        else policyCreated += 1;

        const existingLinks = await tx.evidenceLink.findMany({
          where: { countryPolicyId: policy.id },
          select: { evidenceId: true }
        });
        const linked = new Set(existingLinks.map((entry) => entry.evidenceId));
        const missing = linkedEvidenceIds.filter((id) => !linked.has(id));
        if (missing.length) {
          await tx.evidenceLink.createMany({
            data: missing.map((evidenceId) => ({ evidenceId, countryPolicyId: policy.id }))
          });
        }
      });
    }

    await prisma.syncRun.update({
      where: { id: syncRun.id },
      data: {
        status: "SUCCEEDED",
        pulledCount: manifest.evidence.length + manifest.policies.length,
        appliedCount: rawCreated + evidenceCreated + policyCreated + policyUpdated,
        rejectedCount: protectedPolicies,
        finishedAt: new Date(),
        error: protectedPolicies
          ? { protectedPolicies, message: "Non-draft policies were preserved and not overwritten" }
          : Prisma.JsonNull
      }
    });

    return {
      syncRunId: syncRun.id,
      status: "SUCCEEDED",
      rawCreated,
      evidenceCreated,
      policyCreated,
      policyUpdated,
      protectedPolicies
    };
  } catch (error) {
    await prisma.syncRun.update({
      where: { id: syncRun.id },
      data: {
        status: "FAILED",
        finishedAt: new Date(),
        error: { message: error instanceof Error ? error.message : "Unknown baseline import failure" }
      }
    });
    throw error;
  }
}

importBaseline()
  .then((result) => console.log(JSON.stringify(result, null, 2)))
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
