# HelloCarCar Codex Handoff

Updated: 2026-08-14 (Asia/Shanghai)

## Current state

The closed-test product now includes the DZ multilingual customer workspace, Chinese operations Admin, PostgreSQL/Prisma API, Worker, PDF/notification pipelines, manual corporate T/T operations and a grammY Telegram bot gateway. IR remains `PLANNED`. Do not rebuild the existing modules or revert the large dirty worktree.

Latest completed slice:

- Persisted Telegram conversations and linked-user bot actions with secret/isolation tests and 64-byte callback protection.
- Market-authorized Admin expert-report detail and approval/rejection; generic task completion can no longer bypass the report state machine.
- Public current-policy endpoint and Arabic/French/English customer policy band; historical records remain internal.
- Fixed `@hellocarcar/ui` ESM packaging so Next development mode renders instead of showing an `import.meta` overlay.
- Updated product, API, data and acceptance artifacts to the 2026-08-11 corrected requirements.

## Verification

- `pnpm check`: passed across 9 workspaces.
- API: 3 files, 17 tests passed.
- Worker: 3 files, 5 tests passed, including real Arabic PDF/MinIO and notification database integration.
- Admin: 2 tests passed. Bot: 2 tests passed.
- `pnpm build`: passed; Admin retains a 577 kB chunk warning and Next retains a cache-analysis warning.
- Browser: Arabic customer page and policy anchor, plus report-review detail, passed desktop and 390 x 844 with zero app console errors and no horizontal overflow.
- Temporary QA report/task were deleted; both residue counts are zero.

## Running URLs

- Customer: `http://127.0.0.1:4173/dz/ar`
- Admin: `http://127.0.0.1:4174`
- API: `http://127.0.0.1:8787/health`
- Swagger: `http://127.0.0.1:8787/docs`

API, Web, Admin and Worker development processes were running when this handoff was written.

## Required next milestone

Do not invent compliance parameters. Obtain and record:

1. Dispute evidence file extensions/count/size, retention, front-end hide semantics, staff role access and final privacy/disclaimer/authenticity text.
2. Multilingual sensitive rules, semantic-classifier provider, response matrix, log retention and deletion policy.
3. Approved transaction-flow content, daily policy source whitelist and authoritative Algeria/West Africa sources.
4. Real corporate beneficiary details, Telegram token/webhook, SMTP, model/search, Feishu/NBS and production infrastructure credentials.
5. Final supplier scoring decisions for risk override, the 80-point boundary, missing data and manual edits.

After those inputs, implement dispute and sensitive-rule Prisma migrations/contracts/API/Admin/customer flows with non-destructive evidence retention and tests. Do not expose personal bank accounts, auto-activate from statement matches, or claim external integrations without live evidence.
