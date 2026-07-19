export class ReadOnlyConnector {
  constructor(name) { this.name = name; }
  async pull({ cursor = null } = {}) { return { source: this.name, cursor, records: [], nextCursor: null, status: "NO_AUTH_CONFIGURED" }; }
}

export const connectors = {
  feishu: new ReadOnlyConnector("feishu"),
  nbs: new ReadOnlyConnector("nbs")
};
