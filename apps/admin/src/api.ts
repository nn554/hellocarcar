export const API_BASE = "http://127.0.0.1:8787";

type ApiEnvelope<T> = {
  data: T | null;
  error: { code: string; message: string; details?: unknown } | null;
  requestId: string;
};

export class ApiRequestError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
    readonly details?: unknown
  ) {
    super(message);
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;
  const response = await fetch(API_BASE + path, {
    ...init,
    credentials: "include",
    headers: {
      ...(init.body && !isFormData ? { "Content-Type": "application/json" } : {}),
      ...init.headers
    }
  });
  const envelope = await response.json() as ApiEnvelope<T>;
  if (!response.ok || envelope.error || envelope.data === null) {
    throw new ApiRequestError(
      envelope.error?.code ?? "REQUEST_FAILED",
      envelope.error?.message ?? "请求失败",
      response.status,
      envelope.error?.details
    );
  }
  return envelope.data;
}
