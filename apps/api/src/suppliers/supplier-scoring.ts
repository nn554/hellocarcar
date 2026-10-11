import type { SupplierScoreDimensions } from "@hellocarcar/contracts";

type DimensionKey = Exclude<keyof SupplierScoreDimensions, "brands" | "risks">;

const weights: Record<DimensionKey, number> = {
  registrationYears: 8,
  registeredCapitalWanCny: 8,
  employeeCount: 60,
  usedVehicleExportQualified: 8,
  newVehicleExportQualified: 8,
  authorizedDealerCount: 8
};

const band = (value: number, thresholds: [number, number, number, number, number]) => {
  if (value >= thresholds[4]) return 100;
  if (value >= thresholds[3]) return 70;
  if (value >= thresholds[2]) return 50;
  if (value >= thresholds[1]) return 30;
  return 10;
};

function riskPenalty(dimensions: SupplierScoreDimensions) {
  const risks = dimensions.risks ?? {};
  const count = Object.entries(risks).filter(([key, value]) => key !== "severe" && value === true).length;
  if (count >= 5) return 60;
  if (count === 4) return 40;
  if (count === 3) return 35;
  if (count === 2) return 30;
  if (count === 1) return 20;
  return 0;
}

function dimensionPoints(key: DimensionKey, value: number | boolean) {
  switch (key) {
    case "registrationYears": return band(Number(value), [1, 2, 3, 4, 5]);
    case "registeredCapitalWanCny": return band(Number(value), [100, 300, 500, 1000, 3000]);
    case "employeeCount": return band(Number(value), [10, 20, 30, 40, 80]);
    case "authorizedDealerCount": return band(Number(value), [1, 3, 5, 7, 10]);
    case "usedVehicleExportQualified":
    case "newVehicleExportQualified": return value ? 100 : 10;
  }
}

export function calculateSupplierScore(dimensions: SupplierScoreDimensions) {
  let availableWeight = 0;
  let weightedPoints = 0;
  const breakdown: Partial<Record<DimensionKey, { weight: number; points: number }>> = {};
  for (const key of Object.keys(weights) as DimensionKey[]) {
    const value = dimensions[key];
    if (value === undefined) continue;
    const points = dimensionPoints(key, value as number | boolean);
    availableWeight += weights[key];
    weightedPoints += points * weights[key];
    breakdown[key] = { weight: weights[key], points };
  }
  const completeness = availableWeight;
  const baseScore = availableWeight > 0 ? weightedPoints / availableWeight : 0;
  const penalty = riskPenalty(dimensions);
  const score = Math.max(0, Math.round(baseScore - penalty));
  const insufficientData = completeness < 70;
  const forcedDowngrade = dimensions.risks?.severe === true;
  const recommendation = insufficientData
    ? "INSUFFICIENT_DATA"
    : forcedDowngrade || score < 40
      ? "NOT_RECOMMENDED"
      : score >= 80
        ? "RECOMMENDED"
        : "CAUTION";
  return { score, baseScore: Math.round(baseScore), penalty, completeness, insufficientData, forcedDowngrade, recommendation, breakdown };
}
