# HelloCarCar 2.0 Acceptance Checklist

Updated: 2026-08-14

## Closed-test capabilities verified

- [x] Customer website supports DZ Arabic RTL, French and English; IR remains isolated as `PLANNED`.
- [x] Email OTP creates an HttpOnly server session; Telegram uses a single-use deep link to bind the same account.
- [x] Telegram bot supports decision, supplier, container shipping, corporate T/T payment and report conversations with database-persisted state.
- [x] Bot gateway rejects a wrong secret and unlinked identity; actions execute as the linked user and callback data stays within 64 bytes.
- [x] Free allowance is three lifetime successful decisions; failed, insufficient-data and human-review results do not consume it.
- [x] Monthly USD 99.90 and annual USD 899.90 subscription orders use only enabled corporate receiving accounts.
- [x] Payment proof upload, signed private viewing, finance review, statement CSV matching, refund recording and subscription adjustment are implemented and audited.
- [x] Bank statement matching only advances finance review; it never activates a subscription automatically.
- [x] Standard reports generate PDFs automatically; expert reports require human review and are limited by `fullReportLimit` (default one per month).
- [x] Arabic PDF RTL layout, fonts, watermark, localised validity, MinIO private storage and five-minute signed downloads pass real integration tests.
- [x] Admin report tasks open a protected detail screen; approval/rejection updates report, review task and audit trail atomically.
- [x] Current public policy endpoint returns only active, independently reviewed, evidence-backed policies; historical/internal records stay in Admin.
- [x] Trusted-data expiry, conflict gates, cursor ledgers, market assignments and audit logs remain enforced.
- [x] Public vehicle and policy surfaces fail closed when no current verified facts exist.
- [x] `pnpm check`, production build, API 17/17, Worker 5/5, Admin 2/2 and Bot 2/2 pass.
- [x] Browser QA passes for Arabic customer page and report-review dialog at desktop and 390 x 844 with no console errors or horizontal overflow.

## Not yet acceptable for production

- [ ] Dispute intake/evidence module: file types and limits, retention period, role matrix and final legal declarations are not confirmed.
- [ ] Sensitive-content module: the multilingual rule list, semantic classifier/provider, retention period and deletion policy are not supplied.
- [ ] Country-specific transaction-flow visualisation and daily West Africa/Algeria policy ingestion need approved content and sources.
- [ ] Real AI/model search must cite current approved sources and pass expiry/conflict tests; current unconfigured provider routes to human review.
- [ ] Real Telegram Bot token/webhook, SMTP, authoritative Algeria data, Feishu/NBS credentials and production object storage are not configured.
- [ ] Real corporate bank beneficiary details and bank OpenAPI/statement channel are not configured. Personal accounts must not be exposed.
- [ ] Production domain, TLS, secrets, backup/restore, monitoring and load test for the stated 10,000-click target remain outstanding.
- [ ] Supplier scoring conflicts in the requirements (risk override, 80-point overlap, missing-data handling and manual override) require written confirmation.
