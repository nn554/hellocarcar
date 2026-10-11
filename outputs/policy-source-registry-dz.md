# Algeria Policy Source Registry (Phase 1)

Use these sources as the initial allowlist for China-to-Algeria passenger-vehicle import guidance and daily policy-news discovery. A source is a discovery input until its exact page or document is saved as an `Evidence` record and reviewed by an administrator.

| Priority | Source | Use |
| --- | --- | --- |
| 1 | Algerian Customs (Direction Générale des Douanes) | Customs duties, tariff classification, import declarations, clearance notices |
| 1 | Algerian Tax Authority (Direction Générale des Impôts) | VAT, registration taxes, fiscal circulars and payment rules |
| 1 | Ministry of Industry | Vehicle conformity, technical approval, local representative or dealer requirements |
| 1 | Ministry of Transport | Registration, roadworthiness, transport and port-related procedures |
| 1 | Official Journal of the Algerian Republic (JORADP) | Laws, decrees and effective dates; use as the legal publication record |
| 1 | Algerian Ministry of Commerce | Importer registration, commercial documentation and trade procedures |
| 2 | Algerian ports and port authorities | Port notices, operating calendars and document-handling changes |
| 2 | WTO, WCO, AfCFTA and UNCTAD | Explanatory or regional context; never replace the Algerian legal source |

## Review rule

Save the original URL, source identifier, observed time, publication/effective time, original language, and a content hash. AI may translate and draft a plain-language summary, but publication requires a human reviewer, a verified evidence link, and a market-specific validity window.

## Daily operator workflow

1. Check the allowlisted official pages and official gazette notices.
2. Save each candidate as evidence, preserving the original language and URL.
3. Create a policy-news draft with a short event summary and an importer-impact summary.
4. Link the evidence, send it through review, and publish only after verification.
5. Mark superseded items or expired evidence so they disappear from the public feed.

## Automated collector

The Worker registers `policy-news-daily-fetch` at `06:00 Africa/Algiers` by default. It currently monitors:

- `dz-commerce-regulatory-news`: the Ministry of Commerce regulatory-news collection.
- `dz-customs-used-vehicle-import`: the Customs used-vehicle import guidance page (optional).
- `dz-customs-new-vehicle-import`: the Customs new-vehicle import guidance page (optional).
- `dz-customs-clearance-formalities`: the Customs clearance-formalities page (optional).

The Ministry of Commerce source is enabled by default and was live-checked on 2026-09-02. The three Customs pages are verified official URLs, but currently reject or fail requests from this server network, so they are disabled by default. Enable them through `POLICY_FETCH_SOURCE_IDS` only from a deployment host that can reach them.

Every unseen content hash is stored in the raw-source ledger, an `Evidence` draft and a linked `PolicyNewsItem` draft. Nothing is published automatically. A failed source is recorded on the `SyncRun`; other sources continue.

Environment controls:

- `POLICY_FETCH_ENABLED`: enable the daily scheduler.
- `POLICY_FETCH_CRON` and `POLICY_FETCH_TIMEZONE`: daily schedule.
- `POLICY_FETCH_RUN_ON_STARTUP`: enqueue one deduplicated run when the Worker starts.
- `POLICY_FETCH_SOURCE_IDS`: optional comma-separated source IDs.
- `POLICY_FETCH_TIMEOUT_MS`: timeout per request.
- `POLICY_FETCH_RESPECT_ROBOTS`: keep `true` in production.

For a controlled first run after the database migration:

```powershell
pnpm --filter @hellocarcar/worker policy:fetch
```
