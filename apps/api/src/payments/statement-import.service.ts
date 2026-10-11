import { createHash } from "node:crypto";
import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@hellocarcar/db";
import type { SessionUser } from "@hellocarcar/contracts";
import { parse } from "csv-parse/sync";
import ExcelJS from "exceljs";
import { z } from "zod";
import { PrismaService } from "../database/prisma.service";
import { ObjectStorageService } from "../storage/object-storage.service";

const statementRowSchema = z.object({
  bankReference: z.string().trim().max(200).optional(),
  payerName: z.string().trim().max(240).optional(),
  paymentReference: z.string().trim().min(1).max(200),
  amount: z.coerce.number().positive(),
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()),
  occurredAt: z.coerce.date()
});

const aliases: Record<string, keyof z.input<typeof statementRowSchema>> = {
  bankreference: "bankReference",
  bankref: "bankReference",
  transactionid: "bankReference",
  payername: "payerName",
  payer: "payerName",
  paymentreference: "paymentReference",
  reference: "paymentReference",
  remark: "paymentReference",
  amount: "amount",
  netamount: "amount",
  currency: "currency",
  occurredat: "occurredAt",
  transactiondate: "occurredAt",
  date: "occurredAt"
};

const normalizeHeader = (value: unknown) => String(value ?? "").trim().toLocaleLowerCase().replace(/[^a-z0-9]/g, "");

@Injectable()
export class StatementImportService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ObjectStorageService) private readonly storage: ObjectStorageService
  ) {}

  list() {
    return this.prisma.statementImport.findMany({ include: { destination: true, matches: true, importedBy: true }, orderBy: { createdAt: "desc" }, take: 100 });
  }

  async import(user: SessionUser, destinationId: string, file: Express.Multer.File) {
    const destination = await this.prisma.paymentDestination.findUnique({ where: { id: destinationId } });
    if (!destination) throw new NotFoundException({ code: "PAYMENT_DESTINATION_NOT_FOUND", message: "Payment destination not found" });
    const fileHash = createHash("sha256").update(file.buffer).digest("hex");
    const duplicate = await this.prisma.statementImport.findUnique({ where: { fileHash } });
    if (duplicate) throw new ConflictException({ code: "STATEMENT_ALREADY_IMPORTED", message: "This exact bank statement was already imported" });
    const record = await this.prisma.statementImport.create({ data: { destinationId, importedById: user.id, fileName: file.originalname, fileHash, status: "PROCESSING" } });
    try {
      const stored = await this.storage.putBankStatement(record.id, file);
      const rows = file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ? await this.readXlsx(file.buffer)
        : this.readCsv(file.buffer);
      let matchedRows = 0;
      let failedRows = 0;
      for (const [index, raw] of rows.entries()) {
        const canonical = this.canonicalize(raw);
        const parsed = statementRowSchema.safeParse(canonical);
        if (!parsed.success) {
          failedRows += 1;
          continue;
        }
        const row = parsed.data;
        const rowHash = createHash("sha256").update(`${fileHash}:${index}:${JSON.stringify(canonical)}`).digest("hex");
        const candidates = await this.prisma.paymentOrder.findMany({
          where: {
            destinationId,
            publicReference: row.paymentReference,
            currency: row.currency,
            payableAmount: new Prisma.Decimal(row.amount),
            status: { in: ["AWAITING_PAYMENT", "PROOF_SUBMITTED", "UNDER_REVIEW", "NEEDS_SUPPLEMENT"] }
          },
          take: 2
        });
        const matchStatus = candidates.length === 1 ? "MATCHED" : candidates.length > 1 ? "AMBIGUOUS" : "UNMATCHED";
        const order = candidates.length === 1 ? candidates[0] : undefined;
        try {
          await this.prisma.$transaction(async (tx) => {
            await tx.statementMatch.create({ data: {
              statementImportId: record.id,
              paymentOrderId: order?.id,
              rowHash,
              bankReference: row.bankReference,
              payerName: row.payerName,
              paymentReference: row.paymentReference,
              amount: row.amount,
              currency: row.currency,
              occurredAt: row.occurredAt,
              status: matchStatus,
              rawData: canonical as Prisma.InputJsonObject
            } });
            if (order) {
              await tx.paymentOrder.update({ where: { id: order.id }, data: { status: "UNDER_REVIEW" } });
              await tx.reviewTask.upsert({
                where: { dedupeKey: `payment:${order.id}` },
                create: { marketId: order.marketId, type: "PAYMENT", entityType: "PaymentOrder", entityId: order.id, reason: "BANK_STATEMENT_MATCHED", dedupeKey: `payment:${order.id}` },
                update: { status: "OPEN", reason: "BANK_STATEMENT_MATCHED", completedAt: null, completedById: null, resolution: null }
              });
            }
          });
          if (order) matchedRows += 1;
        } catch (error) {
          if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") continue;
          throw error;
        }
      }
      return await this.prisma.statementImport.update({ where: { id: record.id }, data: {
        objectKey: stored.objectKey,
        status: "COMPLETED",
        totalRows: rows.length,
        matchedRows,
        failedRows,
        completedAt: new Date()
      }, include: { matches: true } });
    } catch (error) {
      await this.prisma.statementImport.update({ where: { id: record.id }, data: { status: "FAILED", errorMessage: error instanceof Error ? error.message : "STATEMENT_IMPORT_FAILED", completedAt: new Date() } });
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException({ code: "STATEMENT_IMPORT_FAILED", message: "Bank statement could not be parsed", details: error instanceof Error ? error.message : undefined });
    }
  }

  private readCsv(buffer: Buffer) {
    return parse(buffer, { columns: true, skip_empty_lines: true, trim: true, bom: true }) as Array<Record<string, unknown>>;
  }

  private async readXlsx(buffer: Buffer) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
    const worksheet = workbook.worksheets[0];
    if (!worksheet) return [];
    const headers: string[] = [];
    worksheet.getRow(1).eachCell((cell, column) => { headers[column - 1] = String(cell.value ?? ""); });
    const rows: Array<Record<string, unknown>> = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const item: Record<string, unknown> = {};
      row.eachCell((cell, column) => { item[headers[column - 1] ?? `column${column}`] = cell.value instanceof Date ? cell.value.toISOString() : cell.text; });
      rows.push(item);
    });
    return rows;
  }

  private canonicalize(raw: Record<string, unknown>) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(raw)) {
      const canonicalKey = aliases[normalizeHeader(key)];
      if (canonicalKey) result[canonicalKey] = value;
    }
    return result;
  }
}
