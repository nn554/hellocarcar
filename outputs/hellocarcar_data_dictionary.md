# HelloCarCar Data Dictionary

| Entity | Purpose | Required fields |
|---|---|---|
| VehicleModel | Standard searchable model | id, make, name, aliases, bodyType, energyType, seats |
| PriceObservation | Evidence-backed FOB reference | modelId, amount, currency, incoterm, source, observedAt, verificationState |
| Supplier | Internal supplier profile | id, name, country, capabilities, verificationState |
| SupplierScore | Auditable supplier signal | supplierId, score, dimensions, evidenceIds, reviewedAt |
| ReportRequest | Paid research workflow | buyerId, scope, status, quoteAmount, reportUrl |
| PaymentProof | Manual T/T or future provider proof | reportId, provider, externalRef, status, verifiedBy |
| PIOrder | Order ownership boundary | piNumber, buyerId, status, sourceRef |
| VINVehicle | Per-vehicle delivery record | vin, piNumber, modelId, status |
| LogisticsEvent | Customer-facing timeline event | vin, code, label, occurredAt, source, visibility |
| Evidence | Source and review trail | kind, sourceRef, observedAt, reviewState, reviewerId |
| AuditLog | Security and business trace | actorId, action, entity, entityId, metadata, createdAt |
