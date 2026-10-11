export type CurrentPolicy = {
  id: string;
  category: string;
  title: string;
  summary: string;
  plainExplanation: string | null;
  steps: unknown;
  requiredDocuments: unknown;
  feesNote: string | null;
  effectiveAt: string;
  expiresAt: string | null;
  reviewedAt: string;
  updatedAt: string;
};

export type CurrentPolicyNews = {
  id: string;
  category: string;
  title: string;
  summary: string;
  impactSummary: string;
  originalLanguage: string | null;
  sourceUrl: string;
  observedAt: string;
  publishedAt: string | null;
  effectiveAt: string | null;
  updatedAt: string;
};

export async function getCurrentPolicies(marketCode: "DZ" | "IR"): Promise<CurrentPolicy[]> {
  const apiBaseUrl = process.env.HELLOCARCAR_API_BASE_URL || "http://127.0.0.1:8787";
  try {
    const response = await fetch(`${apiBaseUrl}/v1/policies?marketCode=${marketCode}`, { next: { revalidate: 300 } });
    if (!response.ok) return [];
    const envelope = await response.json() as { data?: unknown };
    return Array.isArray(envelope.data) ? envelope.data as CurrentPolicy[] : [];
  } catch {
    return [];
  }
}

export async function getCurrentPolicyNews(marketCode: "DZ" | "IR"): Promise<CurrentPolicyNews[]> {
  const apiBaseUrl = process.env.HELLOCARCAR_API_BASE_URL || "http://127.0.0.1:8787";
  try {
    const response = await fetch(`${apiBaseUrl}/v1/policies/news?marketCode=${marketCode}`, { next: { revalidate: 300 } });
    if (!response.ok) return [];
    const envelope = await response.json() as { data?: unknown };
    return Array.isArray(envelope.data) ? envelope.data as CurrentPolicyNews[] : [];
  } catch {
    return [];
  }
}
