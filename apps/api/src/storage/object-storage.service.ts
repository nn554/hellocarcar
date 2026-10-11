import { createHash, randomUUID } from "node:crypto";
import { BadRequestException, Injectable, ServiceUnavailableException } from "@nestjs/common";
import { CreateBucketCommand, GetObjectCommand, HeadBucketCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const allowedPaymentFiles: Record<string, (buffer: Buffer) => boolean> = {
  "application/pdf": (buffer) => buffer.subarray(0, 5).toString("ascii") === "%PDF-",
  "image/png": (buffer) => buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
  "image/jpeg": (buffer) => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
};

@Injectable()
export class ObjectStorageService {
  private readonly bucket = process.env.OBJECT_STORAGE_BUCKET || "hellocarcar-dev";
  private readonly client = new S3Client({
    endpoint: process.env.OBJECT_STORAGE_ENDPOINT || "http://127.0.0.1:9000",
    region: process.env.OBJECT_STORAGE_REGION || "us-east-1",
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.OBJECT_STORAGE_ACCESS_KEY || "hellocarcar",
      secretAccessKey: process.env.OBJECT_STORAGE_SECRET_KEY || "change-me-object-storage"
    }
  });
  private bucketReady?: Promise<void>;

  async putPaymentProof(ownerId: string, file: Express.Multer.File) {
    if (!file || file.size <= 0) throw new BadRequestException({ code: "PAYMENT_PROOF_REQUIRED", message: "Payment proof file is required" });
    if (file.size > 10 * 1024 * 1024) throw new BadRequestException({ code: "FILE_TOO_LARGE", message: "Payment proof must be 10 MB or smaller" });
    const signatureCheck = allowedPaymentFiles[file.mimetype];
    if (!signatureCheck || !signatureCheck(file.buffer)) {
      throw new BadRequestException({ code: "UNSUPPORTED_FILE", message: "Only genuine PDF, PNG and JPEG payment proofs are accepted" });
    }
    await this.ensureBucket();
    const fileHash = createHash("sha256").update(file.buffer).digest("hex");
    const extension = file.mimetype === "application/pdf" ? "pdf" : file.mimetype === "image/png" ? "png" : "jpg";
    const objectKey = `payment-proofs/${ownerId}/${randomUUID()}.${extension}`;
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: objectKey,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: { sha256: fileHash, originalname: Buffer.from(file.originalname).toString("base64url") }
    }));
    return { objectKey, fileHash, mimeType: file.mimetype, fileSize: file.size, originalName: file.originalname };
  }

  async putBankStatement(importId: string, file: Express.Multer.File) {
    if (!file || file.size <= 0) throw new BadRequestException({ code: "BANK_STATEMENT_REQUIRED", message: "Bank statement file is required" });
    if (file.size > 10 * 1024 * 1024) throw new BadRequestException({ code: "FILE_TOO_LARGE", message: "Bank statement must be 10 MB or smaller" });
    const isCsv = ["text/csv", "application/csv", "text/plain"].includes(file.mimetype) && !file.buffer.includes(0);
    const isXlsx = file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      && file.buffer.subarray(0, 2).toString("ascii") === "PK";
    if (!isCsv && !isXlsx) throw new BadRequestException({ code: "UNSUPPORTED_STATEMENT_FILE", message: "Only genuine CSV and XLSX bank statements are accepted" });
    await this.ensureBucket();
    const fileHash = createHash("sha256").update(file.buffer).digest("hex");
    const extension = isXlsx ? "xlsx" : "csv";
    const objectKey = `bank-statements/${importId}/${randomUUID()}.${extension}`;
    await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: objectKey, Body: file.buffer, ContentType: file.mimetype, Metadata: { sha256: fileHash } }));
    return { objectKey, fileHash, extension };
  }

  async putReportPdf(reportRequestId: string, version: number, buffer: Buffer) {
    if (buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
      throw new BadRequestException({ code: "INVALID_REPORT_PDF", message: "Generated report is not a valid PDF" });
    }
    await this.ensureBucket();
    const fileHash = createHash("sha256").update(buffer).digest("hex");
    const objectKey = `reports/${reportRequestId}/v${version}-${fileHash.slice(0, 16)}.pdf`;
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: objectKey,
      Body: buffer,
      ContentType: "application/pdf",
      Metadata: { sha256: fileHash, reportrequestid: reportRequestId, version: String(version) }
    }));
    return { objectKey, fileHash };
  }

  async createPrivateDownloadUrl(objectKey: string) {
    return getSignedUrl(this.client, new GetObjectCommand({ Bucket: this.bucket, Key: objectKey }), { expiresIn: 5 * 60 });
  }

  private ensureBucket() {
    this.bucketReady ??= (async () => {
      try {
        await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      } catch {
        try {
          await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
        } catch (error) {
          throw new ServiceUnavailableException({ code: "OBJECT_STORAGE_UNAVAILABLE", message: "Private object storage is unavailable", details: error instanceof Error ? error.message : undefined });
        }
      }
    })();
    return this.bucketReady;
  }
}
