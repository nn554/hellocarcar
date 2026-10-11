export type PullResult = {
  source: "FEISHU" | "NBS";
  cursor: string | null;
  nextCursor: string | null;
  records: Array<{ sourceKey: string; payload: unknown }>;
  status: "OK" | "NO_AUTH_CONFIGURED";
};

export interface ReadOnlyConnector {
  pull(input?: { cursor?: string | null }): Promise<PullResult>;
}

class FeishuReadOnlyConnector implements ReadOnlyConnector {
  async pull(input: { cursor?: string | null } = {}): Promise<PullResult> {
    if (!process.env.FEISHU_READ_ONLY_TOKEN) return { source: "FEISHU", cursor: input.cursor ?? null, nextCursor: null, records: [], status: "NO_AUTH_CONFIGURED" };
    // Resource-specific adapters must resolve Doc, Sheets, or Base tokens before reading.
    return { source: "FEISHU", cursor: input.cursor ?? null, nextCursor: null, records: [], status: "OK" };
  }
}

class NbsReadOnlyConnector implements ReadOnlyConnector {
  async pull(input: { cursor?: string | null } = {}): Promise<PullResult> {
    if (!process.env.NBS_READ_ONLY_BASE_URL || !process.env.NBS_READ_ONLY_TOKEN) return { source: "NBS", cursor: input.cursor ?? null, nextCursor: null, records: [], status: "NO_AUTH_CONFIGURED" };
    return { source: "NBS", cursor: input.cursor ?? null, nextCursor: null, records: [], status: "OK" };
  }
}

export const connectors = { feishu: new FeishuReadOnlyConnector(), nbs: new NbsReadOnlyConnector() };
