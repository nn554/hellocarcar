# HelloCarCar Data Dictionary

`packages/db/prisma/schema.prisma` is the executable source of truth.

| Domain | Entities | Key invariant |
|---|---|---|
| Identity | `User`, `Organization`, `Membership`, `Session`, `OtpChallenge` | HttpOnly sessions and organization role boundaries. |
| Telegram | `TelegramIdentity`, `AccountLinkToken`, `ConversationSession` | One identity per user; single-use link; channel/external ID unique conversation. |
| Subscription | `Subscription`, `SubscriptionMarketScope`, `EntitlementUsage` | Market-scoped status and monthly expert allowance. |
| Trust | `Evidence`, `EvidenceLink`, `CountryPolicy`, `VehicleMarketEligibility`, `PriceObservation` | Current reviewed evidence gates public facts. |
| Supplier | `Supplier`, `SupplierMarketCapability`, `SupplierDisclosure` | Identity stays internal without reviewed disclosure. |
| Decision | `DecisionQuery`, `Citation` | Only successful free decisions consume allowance. |
| Report | `ReportRequest`, `ReportVersion`, `ReportReview` | Immutable evidence snapshot, private PDF object and audited review. |
| Payment | `PaymentDestination`, `ExchangeRateSnapshot`, `PaymentOrder`, `PaymentProof` | Corporate beneficiaries only; server status is authoritative. |
| Reconciliation | `StatementImport`, `StatementMatch` | Match assists review and cannot activate a subscription. |
| Refund | `RefundRecord` | Offline completion requires a bank reference; evidence is retained. |
| Notification | `Notification` | Atomic outbox claim, retry/backoff and terminal failure state. |
| Review/Audit | `ReviewTask`, `AuditLog` | Assignment, resolution, completion actor and append-only transition evidence. |
| Order/Sync | `PIOrder`, `VINVehicle`, `LogisticsEvent`, `SyncRun`, `RawSourceRecord` | Organization isolation, canonical PI preservation and idempotent read-only sync. |

No dispute-case or sensitive-rule entities exist yet; they must not be represented as delivered until retention, access and legal inputs are approved.
