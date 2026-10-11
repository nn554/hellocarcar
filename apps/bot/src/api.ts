type ApiEnvelope<T> = {
  data: T | null;
  error: { code: string; message: string } | null;
};

const apiBaseUrl = process.env.HELLOCARCAR_API_BASE_URL || "http://127.0.0.1:8787";

async function botApiRequest<T>(path: string, init?: RequestInit) {
  const secret = process.env.TELEGRAM_BOT_API_SECRET;
  if (!secret) throw new Error("TELEGRAM_BOT_API_SECRET is required");
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      "x-telegram-bot-secret": secret,
      ...init?.headers
    }
  });
  const envelope = await response.json() as ApiEnvelope<T>;
  if (!response.ok || envelope.error || !envelope.data) {
    throw new Error(envelope.error?.message || `HelloCarCar API returned ${response.status}`);
  }
  return envelope.data;
}

export type TelegramProfile = {
  telegramUserId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  languageCode?: string;
};

export function claimAccountLink(token: string, profile: TelegramProfile) {
  return botApiRequest<{ linked: true; email: string }>("/v1/auth/telegram/claim", {
    method: "POST",
    body: JSON.stringify({ token, ...profile })
  });
}

export function getAccountStatus(telegramUserId: string) {
  return botApiRequest<{
    linked: boolean;
    email?: string;
    subscriptions?: Array<{ status: string; endsAt: string | null; markets: string[] }>;
  }>(`/v1/auth/telegram/status/${encodeURIComponent(telegramUserId)}`);
}

export type BotConversation = { state: string; context: Record<string, unknown> | null };
export function getConversation(telegramUserId: string) {
  return botApiRequest<BotConversation>(`/v1/bot/conversations/${encodeURIComponent(telegramUserId)}`);
}

export function updateConversation(telegramUserId: string, state: string, context: Record<string, unknown> = {}) {
  return botApiRequest<BotConversation>(`/v1/bot/conversations/${encodeURIComponent(telegramUserId)}`, {
    method: "PUT",
    body: JSON.stringify({ state, context })
  });
}

export function runBotAction<T>(telegramUserId: string, action: string, payload: Record<string, unknown> = {}) {
  return botApiRequest<T>("/v1/bot/actions", {
    method: "POST",
    body: JSON.stringify({ telegramUserId, marketCode: "DZ", action, ...payload })
  });
}
