import { DeleteObjectCommand, GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { prisma } from "@hellocarcar/db";
import { describe, expect, it } from "vitest";
import { createReportGenerator } from "../src/report-generator";

describe("report PDF generator", () => {
  it("generates an Arabic PDF, stores it privately and records one report version", async () => {
    const runId = Date.now().toString();
    const organization = await prisma.organization.create({ data: { name: `Report generator test ${runId}` } });
    const user = await prisma.user.create({ data: { email: `report-generator-${runId}@example.com`, emailVerifiedAt: new Date() } });
    await prisma.membership.create({ data: { userId: user.id, organizationId: organization.id, role: "BUYER" } });
    const market = await prisma.market.findUniqueOrThrow({ where: { code: "DZ" } });
    const report = await prisma.reportRequest.create({
      data: {
        organizationId: organization.id,
        requesterId: user.id,
        marketId: market.id,
        locale: "ar-DZ",
        scope: "تقييم الأدلة المتاحة ومخاطر المورد لدعم قرار شراء السيارات.",
        reportType: "STANDARD",
        status: "PREVIEW_GENERATING",
        isMasked: true
      }
    });
    let objectKey: string | undefined;
    try {
      const result = await createReportGenerator(prisma)(report.id);
      expect(result).toMatchObject({ status: "GENERATED", reportRequestId: report.id, version: 1 });
      const stored = await prisma.reportRequest.findUniqueOrThrow({
        where: { id: report.id },
        include: { versions: true }
      });
      expect(stored.status).toBe("PREVIEW_READY");
      expect(stored.versions).toHaveLength(1);
      expect(stored.versions[0]?.masked).toBe(true);
      objectKey = stored.versions[0]?.pdfObjectKey ?? undefined;
      expect(objectKey).toBeTruthy();

      const client = new S3Client({
        endpoint: process.env.OBJECT_STORAGE_ENDPOINT || "http://127.0.0.1:9000",
        region: "us-east-1",
        forcePathStyle: true,
        credentials: {
          accessKeyId: process.env.OBJECT_STORAGE_ACCESS_KEY || "hellocarcar",
          secretAccessKey: process.env.OBJECT_STORAGE_SECRET_KEY || "change-me-object-storage"
        }
      });
      const response = await client.send(new GetObjectCommand({ Bucket: process.env.OBJECT_STORAGE_BUCKET || "hellocarcar-dev", Key: objectKey }));
      const pdf = Buffer.from(await response.Body!.transformToByteArray());
      expect(pdf.subarray(0, 5).toString("ascii")).toBe("%PDF-");
      expect(pdf.length).toBeGreaterThan(10_000);
      await client.send(new DeleteObjectCommand({ Bucket: process.env.OBJECT_STORAGE_BUCKET || "hellocarcar-dev", Key: objectKey }));
      objectKey = undefined;
    } finally {
      await prisma.notification.deleteMany({ where: { userId: user.id } });
      await prisma.auditLog.deleteMany({ where: { entityType: "ReportRequest", entityId: report.id } });
      await prisma.reportRequest.deleteMany({ where: { id: report.id } });
      await prisma.membership.deleteMany({ where: { userId: user.id } });
      await prisma.user.deleteMany({ where: { id: user.id } });
      await prisma.organization.deleteMany({ where: { id: organization.id } });
      if (objectKey) {
        const client = new S3Client({
          endpoint: process.env.OBJECT_STORAGE_ENDPOINT || "http://127.0.0.1:9000",
          region: "us-east-1",
          forcePathStyle: true,
          credentials: {
            accessKeyId: process.env.OBJECT_STORAGE_ACCESS_KEY || "hellocarcar",
            secretAccessKey: process.env.OBJECT_STORAGE_SECRET_KEY || "change-me-object-storage"
          }
        });
        await client.send(new DeleteObjectCommand({ Bucket: process.env.OBJECT_STORAGE_BUCKET || "hellocarcar-dev", Key: objectKey }));
      }
    }
  });
});
