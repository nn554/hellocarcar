import { BadRequestException } from "@nestjs/common";

type LedgerCursor = {
  resource: string;
  id: string;
};

export function decodeLedgerCursor(cursor: string | undefined, resource: string) {
  if (!cursor) return undefined;
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as LedgerCursor;
    if (parsed.resource !== resource || typeof parsed.id !== "string" || !parsed.id) throw new Error("Invalid cursor");
    return parsed.id;
  } catch {
    throw new BadRequestException({ code: "INVALID_CURSOR", message: "The cursor is invalid for this ledger" });
  }
}

export function encodeLedgerCursor(resource: string, id: string) {
  return Buffer.from(JSON.stringify({ resource, id }), "utf8").toString("base64url");
}

export function toCursorPage<T extends { id: string }, TFilterMeta>(
  rows: T[],
  limit: number,
  resource: string,
  filterMeta: TFilterMeta
) {
  const hasNextPage = rows.length > limit;
  const items = hasNextPage ? rows.slice(0, limit) : rows;
  const last = items.at(-1);
  return {
    items,
    pageInfo: {
      limit,
      hasNextPage,
      nextCursor: hasNextPage && last ? encodeLedgerCursor(resource, last.id) : null
    },
    filterMeta
  };
}
