# HelloCarCar 2.0 Product Spec

Updated: 2026-08-14

## Positioning

HelloCarCar is an Algeria-first vehicle procurement decision service delivered through a multilingual website, operations Admin and Telegram bot. It is not a vehicle marketplace. Iran remains a separate planned market pack.

## Access and charging

- Login: email OTP; Telegram binds to the existing account with a single-use, expiring token.
- Free: three lifetime successful decision queries and one masked report preview. Failed, insufficient-data and human-review queries do not consume the decision allowance.
- Subscription: USD 99.90 monthly or USD 899.90 annually, scoped to a market.
- Standard report: automatically generated PDF after entitlement checks.
- Expert report: human review before generation; default subscription allowance is one per calendar month.
- Payment: manual corporate T/T only in the current phase. Accounts are Admin-managed corporate beneficiaries; personal accounts are prohibited.

## Trust and safety rules

- Public vehicle and policy facts require current `VERIFIED` evidence and independent reviewer attribution.
- Expired, conflicting, unapproved or low-confidence content fails closed or enters human review.
- Policy history is retained internally for audit but only current verified summaries are public.
- Reports snapshot immutable evidence and PDFs are stored privately with short-lived signed downloads.
- Payment, refund, report review, trusted-data and Telegram binding transitions are server-authoritative and audited.
- Bank-statement matches assist finance review and cannot activate subscriptions automatically.
- Feishu and NBS remain read-only sources; no write-back is permitted.

## Delivery surfaces

- Customer: `/dz/ar`, `/dz/fr`, `/dz/en` and matching `/account` workspaces.
- Admin: trusted data, review queue/report detail, payment orders, corporate accounts, exchange rates, statements, refunds and subscriptions.
- Telegram: decisions, verified supplier search, container quote, payment order, reports, status, cancel and menu flows.

## Deferred until inputs exist

Dispute evidence, sensitive-content rules, transaction visualisation, real model/search, authoritative data ingestion, bank OpenAPI, production legal text and production infrastructure require the confirmations listed in the acceptance checklist.
