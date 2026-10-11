import { describe, expect, it } from "vitest";
import { calculateSupplierScore } from "./supplier-scoring";

describe("supplier scoring", () => {
  it("applies the agreed weights and recommends a complete strong supplier", () => {
    const result = calculateSupplierScore({
      registrationYears: 5,
      registeredCapitalWanCny: 3000,
      employeeCount: 80,
      usedVehicleExportQualified: true,
      newVehicleExportQualified: true,
      authorizedDealerCount: 10,
      risks: {}
    });
    expect(result).toMatchObject({ score: 100, completeness: 100, recommendation: "RECOMMENDED" });
    expect(result.breakdown.employeeCount?.weight).toBe(60);
  });

  it("does not treat missing data as zero and withholds a grade below 70 percent completeness", () => {
    const result = calculateSupplierScore({ registrationYears: 5, registeredCapitalWanCny: 3000 });
    expect(result).toMatchObject({ baseScore: 100, completeness: 16, insufficientData: true, recommendation: "INSUFFICIENT_DATA" });
  });

  it("forces a severe verified risk to not recommended regardless of score", () => {
    const result = calculateSupplierScore({
      registrationYears: 5,
      registeredCapitalWanCny: 3000,
      employeeCount: 80,
      usedVehicleExportQualified: true,
      newVehicleExportQualified: true,
      authorizedDealerCount: 10,
      risks: { severe: true, dishonestExecutor: true }
    });
    expect(result).toMatchObject({ score: 80, penalty: 20, forcedDowngrade: true, recommendation: "NOT_RECOMMENDED" });
  });
});
