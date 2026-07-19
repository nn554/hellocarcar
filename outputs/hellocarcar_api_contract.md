# HelloCarCar API Contract (MVP)

All routes are versioned under `/v1`. Responses use `{ data, error, requestId }` envelopes. Customer endpoints enforce buyer ownership; operations endpoints require RBAC.

| Method | Route | Purpose |
|---|---|---|
| GET | `/v1/vehicles` | Search standard models with filters |
| GET | `/v1/vehicles/:id/prices` | Return evidence-backed FOB observations |
| GET | `/v1/suppliers/:id/preview` | Return masked supplier signal |
| POST | `/v1/reports` | Create a report request and quote |
| POST | `/v1/payments/proofs` | Upload/register manual T/T proof |
| GET | `/v1/orders/lookup?pi=...&vin=...` | Ownership-checked logistics lookup |
| POST | `/v1/watchlists` | Watch model, supplier or price |
| GET | `/health` | Service health |

## Payment adapter

`PaymentProvider` exposes `createPayment`, `verifyPayment`, `getPaymentStatus`, and `refundPayment`. MVP implementation is `ManualTtProvider`; online providers must be added without changing report authorization logic.

## Statuses

`DRAFT`, `QUOTED`, `AWAITING_PAYMENT`, `PENDING_REVIEW`, `PAID`, `REPORT_READY`, `CANCELLED`, `REFUNDED`.
