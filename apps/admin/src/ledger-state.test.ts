import { describe, expect, it } from "vitest";
import { ledgerPath, popCursor, pushCursor } from "./ledger-state";

describe("Admin ledger state", () => {
  it("builds encoded server-filter and cursor parameters", () => {
    expect(ledgerPath("/v1/admin/trusted-data/evidence", {
      marketCode: "DZ",
      reviewState: "VERIFIED",
      query: "FOB price",
      limit: 20,
      cursor: "page+/="
    })).toBe("/v1/admin/trusted-data/evidence?marketCode=DZ&reviewState=VERIFIED&query=FOB+price&limit=20&cursor=page%2B%2F%3D");
  });

  it("omits empty filters and keeps cursor history immutable", () => {
    expect(ledgerPath("/v1/admin/review-tasks", { marketCode: "DZ", query: "", cursor: undefined }))
      .toBe("/v1/admin/review-tasks?marketCode=DZ");
    const first = ["cursor-1"];
    const second = pushCursor(first, "cursor-2");
    expect(first).toEqual(["cursor-1"]);
    expect(second).toEqual(["cursor-1", "cursor-2"]);
    expect(popCursor(second)).toEqual(["cursor-1"]);
    expect(pushCursor(first, null)).toBe(first);
  });
});
