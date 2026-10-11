import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client
} from "@aws-sdk/client-s3";
import { Prisma, type PrismaClient } from "@hellocarcar/db";

const execFileAsync = promisify(execFile);
const dimensionWeights = {
  registrationYears: 8,
  registeredCapitalWanCny: 8,
  employeeCount: 60,
  usedVehicleExportQualified: 8,
  newVehicleExportQualified: 8,
  authorizedDealerCount: 8
} as const;

type JsonMap = Record<string, unknown>;

function pythonBinary() {
  if (process.env.REPORT_PYTHON_BIN) return process.env.REPORT_PYTHON_BIN;
  if (process.platform !== "win32") return "python3";
  const bundled = path.join(
    process.env.USERPROFILE || "",
    ".cache",
    "codex-runtimes",
    "codex-primary-runtime",
    "dependencies",
    "python",
    "python.exe"
  );
  return existsSync(bundled) ? bundled : "python";
}

function reportGeneratorPath() {
  if (process.env.REPORT_GENERATOR_PATH) return path.resolve(process.env.REPORT_GENERATOR_PATH);
  return path.resolve(__dirname, "..", "python", "generate_report.py");
}

function isoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function localizedCopy(locale: string) {
  if (locale.startsWith("ar")) return {
    title: "تقرير تقييم مورد السيارات",
    disclaimer: "هذا التقرير أداة لدعم القرار ويعتمد على لقطة الأدلة المتاحة وقت الإنشاء. لا يمثل ضمانا للأداء ولا استشارة قانونية.",
    noSupplier: "لم يتم تحديد مورد. يلخص التقرير نطاق الطلب والأدلة المتاحة فقط.",
    riskPrefix: "مؤشر مخاطر موثق"
  };
  if (locale.startsWith("fr")) return {
    title: "Rapport d'evaluation du fournisseur automobile",
    disclaimer: "Ce rapport est un outil d'aide a la decision fonde sur les preuves verifiees disponibles lors de sa generation. Il ne constitue ni une garantie de performance ni un avis juridique.",
    noSupplier: "Aucun fournisseur n'a ete selectionne. Le rapport resume la demande et les preuves disponibles.",
    riskPrefix: "Indicateur de risque verifie"
  };
  return {
    title: "Vehicle supplier assessment report",
    disclaimer: "This report is a decision-support document based on the verified evidence snapshot available at generation time. It is not a guarantee of performance or legal advice.",
    noSupplier: "No supplier was selected. This report summarizes the requested scope and available verified evidence.",
    riskPrefix: "Verified risk indicator"
  };
}

function supplierAssessment(dimensions: JsonMap, storedScore: number | null) {
  const availableWeight = Object.entries(dimensionWeights).reduce((sum, [key, weight]) =>
    dimensions[key] === undefined || dimensions[key] === null ? sum : sum + weight, 0);
  const risks = typeof dimensions.risks === "object" && dimensions.risks ? dimensions.risks as Record<string, unknown> : {};
  const riskKeys = Object.entries(risks).filter(([key, value]) => key !== "severe" && value === true).map(([key]) => key);
  const severe = risks.severe === true;
  const score = storedScore ?? 0;
  const recommendation = availableWeight < 70
    ? "INSUFFICIENT_DATA"
    : severe || score < 40 ? "NOT_RECOMMENDED" : score >= 80 ? "RECOMMENDED" : "CAUTION";
  return { score, completeness: availableWeight, recommendation, riskKeys };
}

export function createReportGenerator(prisma: PrismaClient) {
  const bucket = process.env.OBJECT_STORAGE_BUCKET || "hellocarcar-dev";
  const s3 = new S3Client({
    endpoint: process.env.OBJECT_STORAGE_ENDPOINT || "http://127.0.0.1:9000",
    region: process.env.OBJECT_STORAGE_REGION || "us-east-1",
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.OBJECT_STORAGE_ACCESS_KEY || "hellocarcar",
      secretAccessKey: process.env.OBJECT_STORAGE_SECRET_KEY || "change-me-object-storage"
    }
  });
  let bucketReady: Promise<void> | undefined;

  const ensureBucket = () => bucketReady ??= (async () => {
    try {
      await s3.send(new HeadBucketCommand({ Bucket: bucket }));
    } catch {
      await s3.send(new CreateBucketCommand({ Bucket: bucket }));
    }
  })();

  return async (reportRequestId: string) => {
    const existing = await prisma.reportRequest.findUnique({
      where: { id: reportRequestId },
      include: {
        market: true,
        requester: { include: { telegramIdentity: true } },
        vehicleModel: true,
        supplier: {
          include: {
            capabilities: {
              include: { evidenceLinks: { include: { evidence: true } } }
            }
          }
        },
        versions: { where: { pdfObjectKey: { not: null } }, orderBy: { version: "desc" }, take: 1 }
      }
    });
    if (!existing) throw new Error(`Report request ${reportRequestId} does not exist`);
    if (existing.versions[0]?.pdfObjectKey) {
      await prisma.reportRequest.update({
        where: { id: existing.id },
        data: { status: existing.isMasked ? "PREVIEW_READY" : "REPORT_READY" }
      });
      return { status: "ALREADY_GENERATED", reportRequestId, version: existing.versions[0].version };
    }
    if (!["PREVIEW_GENERATING", "FULL_GENERATING", "GENERATION_FAILED"].includes(existing.status)) {
      throw new Error(`Report request ${reportRequestId} is not ready for PDF generation`);
    }

    const capability = existing.supplier?.capabilities.find((item) => item.marketId === existing.marketId && item.reviewState === "VERIFIED");
    const dimensions = capability?.dimensions && typeof capability.dimensions === "object" ? capability.dimensions as JsonMap : {};
    const assessment = supplierAssessment(dimensions, capability?.score ?? null);
    const now = new Date();
    const currentEvidence = (capability?.evidenceLinks ?? [])
      .map((link) => link.evidence)
      .filter((evidence) => evidence.reviewState === "VERIFIED" && evidence.reviewedById && (!evidence.validUntil || evidence.validUntil > now));
    const validUntil = currentEvidence.reduce<Date | null>((earliest, evidence) => {
      if (!evidence.validUntil) return earliest;
      return !earliest || evidence.validUntil < earliest ? evidence.validUntil : earliest;
    }, null) ?? new Date(now.getTime() + 7 * 24 * 60 * 60_000);
    const latestEvidenceDate = currentEvidence.reduce((latest, evidence) => evidence.observedAt > latest ? evidence.observedAt : latest, existing.updatedAt);
    const copy = localizedCopy(existing.locale);
    const supplierName = existing.isMasked
      ? `Verified supplier ${existing.supplierId ? existing.supplierId.slice(-4).toUpperCase() : "-"}`
      : existing.supplier?.displayName || existing.supplier?.legalName || "-";
    const risks = existing.isMasked
      ? assessment.riskKeys.map((_, index) => `${copy.riskPrefix} ${index + 1}`)
      : assessment.riskKeys.map((key) => `${copy.riskPrefix}: ${key}`);
    const summary = existing.supplier
      ? `${supplierName}. ${existing.scope}`
      : `${copy.noSupplier} ${existing.scope}`;
    const nextVersion = (await prisma.reportVersion.aggregate({ where: { reportRequestId }, _max: { version: true } }))._max.version ?? 0;
    const version = nextVersion + 1;
    const reportNumber = `HCC-${existing.createdAt.toISOString().slice(0, 10).replace(/-/g, "")}-${existing.id.slice(-6).toUpperCase()}`;
    const payload = {
      locale: existing.locale,
      title: copy.title,
      reportNumber,
      generatedAt: isoDate(now),
      summary,
      company: {
        recommendation: assessment.recommendation,
        score: existing.isMasked ? "MASKED" : assessment.score,
        completeness: assessment.completeness,
        risks
      },
      queryDate: isoDate(existing.createdAt),
      dataUpdatedAt: isoDate(latestEvidenceDate),
      validUntil: isoDate(validUntil),
      disclaimer: copy.disclaimer
    };
    const evidenceSnapshot = currentEvidence.map((evidence) => ({
      id: evidence.id,
      title: evidence.title,
      kind: evidence.kind,
      sourceSystem: evidence.sourceSystem,
      sourceRef: evidence.sourceRef,
      sourceUrl: evidence.sourceUrl,
      observedAt: evidence.observedAt.toISOString(),
      validUntil: evidence.validUntil?.toISOString() ?? null,
      contentHash: evidence.contentHash
    }));

    const tempDirectory = await mkdtemp(path.join(tmpdir(), "hellocarcar-report-"));
    const inputPath = path.join(tempDirectory, "payload.json");
    const outputPath = path.join(tempDirectory, "report.pdf");
    try {
      await writeFile(inputPath, JSON.stringify(payload), "utf8");
      await execFileAsync(pythonBinary(), [reportGeneratorPath(), inputPath, outputPath], { timeout: 60_000, maxBuffer: 2 * 1024 * 1024 });
      const pdf = await readFile(outputPath);
      if (pdf.subarray(0, 5).toString("ascii") !== "%PDF-") throw new Error("Report generator returned an invalid PDF");
      await ensureBucket();
      const objectKey = `reports/${reportRequestId}/v${version}.pdf`;
      await s3.send(new PutObjectCommand({ Bucket: bucket, Key: objectKey, Body: pdf, ContentType: "application/pdf" }));

      await prisma.$transaction(async (tx) => {
        await tx.reportVersion.create({
          data: {
            reportRequestId,
            version,
            masked: existing.isMasked,
            content: payload as Prisma.InputJsonValue,
            evidenceSnapshot: evidenceSnapshot as Prisma.InputJsonValue,
            pdfObjectKey: objectKey
          }
        });
        await tx.reportRequest.update({ where: { id: reportRequestId }, data: { status: existing.isMasked ? "PREVIEW_READY" : "REPORT_READY" } });
        await tx.auditLog.create({
          data: { action: "REPORT_PDF_GENERATED", entityType: "ReportRequest", entityId: reportRequestId, marketCode: existing.market.code, metadata: { version, masked: existing.isMasked, objectKey } }
        });
        await tx.notification.upsert({
          where: { dedupeKey: `report:${reportRequestId}:v${version}:email` },
          create: {
            userId: existing.requesterId,
            channel: "EMAIL",
            type: "REPORT_READY",
            recipient: existing.requester.email,
            payload: { reportId: reportRequestId, version, masked: existing.isMasked },
            dedupeKey: `report:${reportRequestId}:v${version}:email`
          },
          update: {}
        });
        if (existing.requester.telegramIdentity) {
          await tx.notification.upsert({
            where: { dedupeKey: `report:${reportRequestId}:v${version}:telegram` },
            create: {
              userId: existing.requesterId,
              channel: "TELEGRAM",
              type: "REPORT_READY",
              recipient: existing.requester.telegramIdentity.telegramUserId,
              payload: { reportId: reportRequestId, version, masked: existing.isMasked },
              dedupeKey: `report:${reportRequestId}:v${version}:telegram`
            },
            update: {}
          });
        }
      });
      return { status: "GENERATED", reportRequestId, version, objectKey, bytes: pdf.length };
    } catch (error) {
      await prisma.reportRequest.update({ where: { id: reportRequestId }, data: { status: "GENERATION_FAILED" } });
      await prisma.auditLog.create({
        data: { action: "REPORT_PDF_FAILED", entityType: "ReportRequest", entityId: reportRequestId, marketCode: existing.market.code, metadata: { error: error instanceof Error ? error.message : "Unknown report generation error" } }
      });
      throw error;
    } finally {
      await rm(tempDirectory, { recursive: true, force: true });
    }
  };
}
