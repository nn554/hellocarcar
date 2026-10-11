export type CatalogVehicle = {
  id: string;
  make: string;
  name: string;
  energyType: string;
  bodyType: string;
  priceRange: {
    from: number;
    to: number;
    currency: string;
    incoterm: string;
    sourceDate: string;
    validUntil: string | null;
    reviewState: "VERIFIED";
  } | null;
  eligibility: {
    eligible: true;
    restrictions: unknown;
    reviewState: "VERIFIED";
    reviewedAt: string;
  } | null;
};

export async function getCatalogVehicles(marketCode: "DZ" | "IR"): Promise<CatalogVehicle[]> {
  const apiBaseUrl = process.env.HELLOCARCAR_API_BASE_URL || "http://127.0.0.1:8787";
  try {
    const response = await fetch(`${apiBaseUrl}/v1/vehicles?marketCode=${marketCode}`, { next: { revalidate: 60 } });
    if (!response.ok) return [];
    const envelope = await response.json() as { data?: unknown };
    return Array.isArray(envelope.data) ? envelope.data as CatalogVehicle[] : [];
  } catch {
    return [];
  }
}
