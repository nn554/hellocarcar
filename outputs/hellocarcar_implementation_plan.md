# HelloCarCar Multi-market MVP Implementation Plan

## Architecture

HelloCarCar uses a modular monorepo: Next.js customer Web, Refine operations Admin, NestJS modular API, BullMQ Worker, shared Zod contracts and Prisma/PostgreSQL. Redis is reserved for queues, cache, OTP state and rate limiting; S3-compatible private storage holds evidence, payment proof and report files.

Market-specific facts always carry `marketId`. Global vehicle identity may be reused, but policy, eligibility, price, supplier capability, AI retrieval, report and logistics conclusions cannot cross markets.

## Delivery Stages

| Stage | Scope | Status |
|---|---|---|
| W0 | Product boundaries, trust rules, data/API documents | Complete |
| W1 | Reviewable multilingual prototype and initial API behavior | Complete and preserved in Git history (`fed6013`) |
| W2 | Next.js/NestJS/Prisma foundation, market model, OTP/session, RBAC boundary, tests | Complete |
| W3 | Algeria evidence, vehicle, price, supplier, policy and eligibility operations workflow | In progress |
| W4 | Market-isolated hybrid retrieval, structured AI answers, citations, quotas and review routing | Pending |
| W5 | Reports, VIP market scope, T/T review, supplier disclosure and PDF delivery | Pending |
| W6 | Read-only Feishu/NBS sync, raw records, normalization, idempotency, quarantine and PI/VIN timeline | Pending |
| W7 | Alibaba Cloud Singapore closed beta for 10-20 buyers and two reviewers | Pending |
| W8 | Iran market pack after legal, sanctions, payment, export and data review | Pending |

## W3 Definition

1. Add authenticated admin resources for evidence, policies, vehicle eligibility, suppliers and price observations.
2. Enforce analyst market assignment and state transitions: draft, pending review, verified, rejected, expired.
3. Store source date, validity, content hash and reviewer on every customer-visible fact.
4. Connect the DZ customer catalog to the API and expose filterable verified evidence only.
5. Create review tasks when policy expires or evidence conflicts.
6. Add API and browser tests for CRUD permissions, state transitions and public filtering.

W3 needs an agreed authoritative Algeria source list, an analyst/reviewer assignment, evidence validity rules and confirmation of which seed models remain in the first closed test.

W3 trusted-data API/publication slice completed on 2026-07-20:

- Authenticated list/create/transition APIs for all six trusted-data resources.
- Member-level analyst market assignment, admin-only verification/rejection and reviewer attribution.
- Audit logs plus conflict/expiry review-task creation.
- DZ public vehicle and price APIs filtered by verified eligibility, current verified prices and current verified linked evidence.
- Customer catalog server-side API loading with no static fact fallback.
- PostgreSQL integration coverage for role boundaries, market assignment, self-review denial, conflict blocking, state transitions and public publication gating.

W3 Admin workflow slice completed on 2026-07-23:

- Authenticated Chinese Admin workspace for all six trusted-data resources with searchable/filterable ledgers and form option data.
- Create forms, draft-only PATCH editing, evidence-link replacement and review-state actions using the existing OTP session and market scopes.
- Review-task queue with open/completed filters, admin assignment/unassignment, claiming, completion resolution and audit logs.
- PATCH conflict detection reruns after evidence source/hash edits, so editing cannot bypass the blocking conflict workflow.
- API coverage for draft locking, PATCH conflict creation, assignment/completion permissions and publication gating; test-owned buyers, decisions, reports and review tasks are cleaned after each run.
- Desktop and 390 x 844 mobile browser acceptance for the Admin dashboard, trusted-data ledger and record drawer.

W3 automatic-expiry slice completed on 2026-07-23:

- Shared database service expires only verified evidence, policies and price observations whose validity has elapsed.
- Conditional updates, per-record transactions and a unique review-task `dedupeKey` make retries and concurrent worker runs idempotent.
- Expired facts create market-scoped review tasks and append per-record plus per-run audit evidence.
- BullMQ registers an hourly `trusted-data-expiry-sweep` scheduler and routes the job through the shared service.
- PostgreSQL coverage proves first-run transitions/task creation and second-run zero changes; worker coverage proves job routing.

W3 ledger pagination slice completed on 2026-07-24:

- Trusted-data and review-task list APIs now return cursor pages inside the existing response envelope, with filtered totals and server-derived filter counts.
- Opaque cursors are bound to resource, market, search and filter state; malformed or cross-ledger cursors return `INVALID_CURSOR`.
- Admin trusted-data and review ledgers use server-side search/filtering, cursor next/previous controls and backend totals; the dashboard no longer mistakes the first page for the full count.
- PostgreSQL API coverage proves pagination without duplicate rows, search, review-state/type/status metadata and invalid cursor handling; Admin unit coverage proves encoded query construction and immutable cursor history.

Remaining W3 work: authoritative Algeria source configuration, closed-test model approval, decision/report detail review screens, browser coverage for the new ledger controls and customer catalog data states. Delete/archive remains blocked until retention and restore semantics are defined.

## Reference Projects And Skills

- `brocoders/nestjs-boilerplate`: authentication, files, Swagger and test structure patterns.
- `amannn/next-intl`: locale routing and server/client message patterns.
- `refinedev/refine`: operations resource and access-control patterns.
- `vercel/chatbot`: later streaming AI UI and provider boundaries.
- `taskforcesh/bullmq`: jobs, retries and deduplication.
- `stalniy/casl`: role/resource/market authorization patterns.
- Use `openai-docs` before choosing the production OpenAI model or Responses API contract.
- Use Feishu skills to resolve resource types and prove read-only connector behavior.
- Use `browser` for responsive/RTL acceptance and `pdf` for report render verification.

These repositories are pattern references, not code to copy wholesale. Existing workspace conventions and locked product boundaries take precedence.
