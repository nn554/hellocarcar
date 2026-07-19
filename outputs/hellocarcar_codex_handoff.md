# HelloCarCar Codex Handoff

Updated: 2026-07-19 (Asia/Shanghai)

## New conversation starter

Paste the following into the first message of the new HelloCarCar Codex conversation:

```text
Continue the HelloCarCar project in:
C:\Users\34334\Documents\Codex\2026-07-14\https-msauto-group-utm-source-ig

First read outputs/hellocarcar_codex_handoff.md, outputs/hellocarcar_product_spec.md,
outputs/hellocarcar_data_dictionary.md, outputs/hellocarcar_api_contract.md, README.md,
and inspect the existing files. Do not rebuild W0 or replace the current prototype.

The next implementation milestone is W2: create the real PostgreSQL/Prisma data layer,
NestJS API structure, authentication/RBAC and tests while preserving the existing API
contract and the dependency-free Web/PWA prototype. Re-verify the report submission CORS
flow before expanding the API. Keep payment provider-neutral, keep NBS/Feishu read-only,
and do not claim real external sync success without credentials and evidence.

At the end, report completed work, changed files, run commands, test results, known issues,
and the exact prerequisite for W3.
```

## Product decisions already locked

- Algeria-first procurement decision assistant for Chinese vehicles.
- Arabic RTL customer UI, with French and English; Chinese operations UI later.
- MVP includes vehicle discovery, evidence-backed FOB ranges, masked suppliers, paid reports,
  manual T/T review, and PI/VIN logistics lookup.
- No vehicle marketplace, cart, inventory lock, online vehicle sale or supplier self-service.
- PostgreSQL is the future system of record. NBS and Feishu are read-only integration sources.
- Manual T/T is the first payment implementation. Future providers must implement the same
  `PaymentProvider` boundary.
- Supplier identity remains masked until a paid, human-reviewed report is authorized.

## Current project state

The workspace was empty at the start. W0 and a reviewable W1 prototype are now present.

### Implemented

- Root workspace manifests, environment template and Docker database/Redis definition.
- Dependency-free multilingual Web/PWA prototype.
- Arabic RTL layout, French/English switching, responsive mobile layout.
- Vehicle catalog with text, energy and body filters.
- Algeria policy/knowledge section.
- Purchase report modal and API request code.
- PI lookup and logistics timeline using sample data.
- Lightweight Node HTTP API with health, vehicles, report request, payment proof and order
  lookup endpoints.
- `ManualTtProvider` with create, verify, status and refund methods.
- Read-only NBS/Feishu connector interfaces that explicitly return `NO_AUTH_CONFIGURED`.
- Product spec, data dictionary, API contract and acceptance checklist.

### Not implemented yet

- Next.js migration and production component library.
- NestJS application structure.
- Prisma schema, migrations or live PostgreSQL persistence.
- Authentication, sessions, customer ownership and RBAC enforcement.
- Real file/object storage or PDF report generation.
- Real NBS/Feishu authorization and sync.
- Idempotent sync persistence and review queue.
- RAG ingestion, retrieval, citations and human-review workflow.
- Telegram/email notifications.
- Operations/finance/admin screens.
- Production deployment, backups, monitoring and secrets management.

## Important verification evidence

Static syntax checks passed for:

- `apps/web/app.js`
- `apps/api/src/server.mjs`
- `apps/api/src/payment-provider.mjs`
- `apps/api/src/sync-connectors.mjs`

Browser verification completed for:

- Arabic page structure and RTL content.
- English switch changing document direction to `ltr`.
- Search filter returning only `Toyota BZ3X` for `Toyota`.
- PI example `NBS-2026-AL-001` returning four logistics events.
- Purchase report modal opening with three form fields.

The report form initially failed browser submission because the API preflight response lacked
`Access-Control-Allow-Methods`. This was fixed in `apps/api/src/server.mjs`, but the complete
browser submission must be re-run after restarting both services. Do not mark that acceptance
case complete until the browser displays a generated report id and quote.

## Runtime commands

System `node` is not on PATH. Use the bundled Codex runtime:

```powershell
$node = "C:\Users\34334\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

# Static checks
& $node scripts\check.mjs

# Terminal 1: Web
& $node scripts\serve-static.mjs apps\web 4173

# Terminal 2: API
& $node apps\api\src\server.mjs
```

Open:

- Web: `http://127.0.0.1:4173/`
- API health: `http://127.0.0.1:8787/health`

The Codex sandbox may reclaim detached background processes. Keep the Web and API commands
running in separate live terminal sessions during browser verification.

## Key files

- `apps/web/index.html`: customer page structure.
- `apps/web/styles.css`: responsive and RTL visual system.
- `apps/web/app.js`: translations, filters, report form and PI timeline.
- `apps/api/src/server.mjs`: current contract-first API prototype.
- `apps/api/src/payment-provider.mjs`: provider-neutral payment boundary.
- `apps/api/src/sync-connectors.mjs`: read-only external connector boundary.
- `outputs/hellocarcar_api_contract.md`: interface source of truth.
- `outputs/hellocarcar_data_dictionary.md`: initial data model source of truth.
- `docker-compose.yml`: PostgreSQL/pgvector and Redis services.

## Next milestone: W2

1. Re-run Web + API and verify report creation after the CORS fix.
2. Create Prisma schema for users, organizations, roles, vehicles, price observations,
   suppliers, supplier scores, evidence, reports, payments, PI orders, VIN vehicles,
   logistics events and audit logs.
3. Add PostgreSQL migration and seed data matching the current prototype.
4. Create NestJS modules/controllers/services behind the existing `/v1` contract.
5. Implement authentication and RBAC roles: buyer, analyst, finance and admin.
6. Enforce buyer ownership for PI/VIN lookup and payment authorization for report access.
7. Add unit and API tests for unauthorized access, ownership, report states and payment status.

## Implementation constraints

- Preserve full canonical PI suffixes; do not normalize them to a shorter base PI.
- External facts need evidence, source dates and verification states.
- AI must not write business data directly.
- Payment status is server-authoritative; the client cannot unlock reports.
- Do not expose supplier identity in free endpoints.
- Do not edit NBS or Feishu source data from HelloCarCar.
- Do not replace the current prototype before its behavior is covered by tests or a reviewed
  Next.js equivalent.

## Handoff format for every future conversation

Each conversation must finish with:

1. Completed functionality.
2. Changed files.
3. Start commands.
4. Test commands and results.
5. Known issues.
6. Exact prerequisites and prompt for the next conversation.
