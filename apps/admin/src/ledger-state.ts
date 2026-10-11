export function ledgerPath(path: string, params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  return path + "?" + query.toString();
}

export function pushCursor(cursors: string[], nextCursor: string | null) {
  return nextCursor ? [...cursors, nextCursor] : cursors;
}

export function popCursor(cursors: string[]) {
  return cursors.slice(0, -1);
}
