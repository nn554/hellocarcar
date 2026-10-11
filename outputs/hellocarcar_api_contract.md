# HelloCarCar API Contract 0.8

Responses use `{ data, error, requestId }`. Session routes use an HttpOnly cookie; bot-only routes additionally require `x-telegram-bot-secret`.

## Public

- `GET /health`, `GET /v1/markets`
- `GET /v1/vehicles?marketCode=DZ`, `GET /v1/vehicles/:id/prices?marketCode=DZ`
- `GET /v1/policies?marketCode=DZ`: current reviewed policy guidance only; source URLs and internal states are not exposed.
- `GET /v1/policies/news?marketCode=DZ`: published, current and evidence-backed policy-news items only; every item includes a source URL for user inspection.
- `POST /v1/auth/otp/request`, `POST /v1/auth/otp/verify`
- `POST /v1/auth/telegram/claim`, `GET /v1/auth/telegram/status/:telegramUserId`: bot-secret protected.

## Customer session

- `GET /v1/auth/me`, `POST /v1/auth/logout`, `POST /v1/auth/telegram/link-token`
- `GET|POST /v1/decisions`, `GET|POST /v1/reports`, `GET /v1/reports/:id`, `GET /v1/reports/:id/download`
- `POST /v1/suppliers/recommendations`, `POST /v1/shipping/quotes`
- `GET /v1/orders/lookup`
- `GET /v1/payments/destinations`, `GET|POST /v1/payments/orders`, proof upload/download and refund request routes.

## Bot gateway

- `GET|PUT /v1/bot/conversations/:telegramUserId`
- `POST /v1/bot/actions`: discriminated actions for decisions, suppliers, shipping, payments and reports. The Telegram identity is resolved to a normal organization-scoped session user before business services run.

## Operations

- Trusted-data list/create/draft-edit/transition routes under `/v1/admin/trusted-data`, including `policy-news`.
- Cursor review queue and assignment/completion under `/v1/admin/review-tasks`.
- `GET /v1/admin/reports/:id` and `PATCH /v1/admin/reports/:id/review` for market-authorized report detail and atomic approval/rejection.
- Payment destinations, 24-hour exchange rates, orders, signed proof viewing, statement imports, finance review, refunds and subscriptions under `/v1/admin/payments`.

## Invariants

- DZ is active and IR requests fail closed while `PLANNED`.
- Customer records are scoped by organization and market; bot actions cannot choose another user.
- Only enabled corporate destinations are customer-visible.
- Statement matches never activate a subscription; finance approval does.
- Report and payment object links expire after five minutes.
- Delete/archive endpoints are intentionally absent until retention and restore rules are approved.
