import { z } from "zod";

export const marketCodeSchema = z.enum(["DZ", "IR"]);
export type MarketCode = z.infer<typeof marketCodeSchema>;

export const localeCodeSchema = z.enum(["ar-DZ", "fr-DZ", "en", "fa-IR"]);
export type LocaleCode = z.infer<typeof localeCodeSchema>;

export const userRoleSchema = z.enum(["BUYER", "ANALYST", "FINANCE", "CUSTOMER_SERVICE", "REVIEWER", "ADMIN"]);
export type UserRole = z.infer<typeof userRoleSchema>;

export const reviewStateValues = [
  "DRAFT",
  "PENDING_REVIEW",
  "VERIFIED",
  "REJECTED",
  "EXPIRED",
  "NEEDS_LOCAL_CONFIRMATION"
] as const;
export const reviewStateSchema = z.enum(reviewStateValues);
export type ReviewState = z.infer<typeof reviewStateSchema>;

export const sourceSystemSchema = z.enum(["MANUAL", "FEISHU", "NBS", "PUBLIC_SOURCE"]);
export type SourceSystem = z.infer<typeof sourceSystemSchema>;

export const trustedDataResourceSchema = z.enum([
  "evidence",
  "policies",
  "policy-news",
  "eligibility",
  "suppliers",
  "supplier-capabilities",
  "price-observations"
]);
export type TrustedDataResource = z.infer<typeof trustedDataResourceSchema>;

const optionalDateTimeSchema = z.string().datetime().optional();
const evidenceIdsSchema = z.array(z.string().cuid()).min(1);

export const ledgerCursorSchema = z.string().min(8).max(512).optional();
export const ledgerLimitSchema = z.coerce.number().int().min(1).max(100).default(25);
export const ledgerSearchSchema = z.string().trim().min(1).max(120).optional();

export const trustedDataListQuerySchema = z.object({
  marketCode: marketCodeSchema.default("DZ"),
  reviewState: z.union([reviewStateSchema, z.literal("ALL")]).default("ALL"),
  query: ledgerSearchSchema,
  limit: ledgerLimitSchema,
  cursor: ledgerCursorSchema
});
export type TrustedDataListQuery = z.infer<typeof trustedDataListQuerySchema>;

export const createEvidenceSchema = z.object({
  marketCode: marketCodeSchema,
  kind: z.string().trim().min(2).max(80),
  title: z.string().trim().min(3).max(240),
  sourceSystem: sourceSystemSchema,
  sourceRef: z.string().trim().min(2).max(240),
  sourceUrl: z.string().url().optional(),
  observedAt: z.string().datetime(),
  validUntil: optionalDateTimeSchema,
  contentHash: z.string().trim().min(16).max(128),
  metadata: z.record(z.unknown()).optional()
});
export type CreateEvidenceInput = z.infer<typeof createEvidenceSchema>;

export const createPolicySchema = z.object({
  marketCode: marketCodeSchema,
  category: z.string().trim().min(2).max(80),
  title: z.string().trim().min(3).max(240),
  summary: z.string().trim().min(10).max(4000),
  plainExplanation: z.string().trim().min(10).max(4000).optional(),
  steps: z.array(z.string().trim().min(1).max(500)).max(30).optional(),
  requiredDocuments: z.array(z.string().trim().min(1).max(240)).max(50).optional(),
  feesNote: z.string().trim().max(2000).optional(),
  effectiveAt: z.string().datetime(),
  expiresAt: optionalDateTimeSchema,
  sourceUrl: z.string().url(),
  evidenceIds: evidenceIdsSchema
});
export type CreatePolicyInput = z.infer<typeof createPolicySchema>;

export const createPolicyNewsSchema = z.object({
  marketCode: marketCodeSchema,
  category: z.string().trim().min(2).max(80),
  title: z.string().trim().min(3).max(240),
  summary: z.string().trim().min(10).max(4000),
  impactSummary: z.string().trim().min(10).max(4000),
  originalLanguage: z.string().trim().min(2).max(32).optional(),
  sourceUrl: z.string().url(),
  sourceSystem: sourceSystemSchema,
  sourceRef: z.string().trim().min(2).max(240),
  observedAt: z.string().datetime(),
  publishedAt: optionalDateTimeSchema,
  effectiveAt: optionalDateTimeSchema,
  relatedPolicyId: z.string().cuid().optional(),
  evidenceIds: evidenceIdsSchema
});
export type CreatePolicyNewsInput = z.infer<typeof createPolicyNewsSchema>;

export const createEligibilitySchema = z.object({
  marketCode: marketCodeSchema,
  vehicleModelId: z.string().cuid(),
  eligible: z.boolean().nullable(),
  restrictions: z.record(z.unknown()).optional(),
  evidenceIds: evidenceIdsSchema
});
export type CreateEligibilityInput = z.infer<typeof createEligibilitySchema>;

export const createSupplierSchema = z.object({
  marketCode: marketCodeSchema,
  legalName: z.string().trim().min(2).max(240),
  displayName: z.string().trim().min(2).max(160),
  countryCode: z.string().trim().length(2).transform((value) => value.toUpperCase()),
  contactName: z.string().trim().max(160).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().trim().max(60).optional()
});
export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;

export const createSupplierCapabilitySchema = z.object({
  marketCode: marketCodeSchema,
  supplierId: z.string().cuid(),
  score: z.number().int().min(0).max(100).optional(),
  dimensions: z.record(z.unknown()).optional(),
  routes: z.record(z.unknown()).optional(),
  evidenceIds: evidenceIdsSchema
});
export type CreateSupplierCapabilityInput = z.infer<typeof createSupplierCapabilitySchema>;

export const createPriceObservationSchema = z.object({
  marketCode: marketCodeSchema,
  vehicleModelId: z.string().cuid(),
  amount: z.number().positive(),
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()),
  incoterm: z.string().trim().min(2).max(20).transform((value) => value.toUpperCase()),
  observedAt: z.string().datetime(),
  validUntil: optionalDateTimeSchema,
  sourceSystem: sourceSystemSchema,
  sourceRef: z.string().trim().min(2).max(240),
  evidenceIds: evidenceIdsSchema
});
export type CreatePriceObservationInput = z.infer<typeof createPriceObservationSchema>;

const atLeastOneField = <T extends z.ZodRawShape>(schema: z.ZodObject<T>) =>
  schema.refine((value) => Object.keys(value).length > 0, { message: "At least one field is required" });

export const updateEvidenceSchema = atLeastOneField(z.object({
  kind: z.string().trim().min(2).max(80).optional(),
  title: z.string().trim().min(3).max(240).optional(),
  sourceSystem: sourceSystemSchema.optional(),
  sourceRef: z.string().trim().min(2).max(240).optional(),
  sourceUrl: z.string().url().nullable().optional(),
  observedAt: z.string().datetime().optional(),
  validUntil: z.string().datetime().nullable().optional(),
  contentHash: z.string().trim().min(16).max(128).optional(),
  metadata: z.record(z.unknown()).nullable().optional()
}));
export type UpdateEvidenceInput = z.infer<typeof updateEvidenceSchema>;

export const updatePolicySchema = atLeastOneField(z.object({
  category: z.string().trim().min(2).max(80).optional(),
  title: z.string().trim().min(3).max(240).optional(),
  summary: z.string().trim().min(10).max(4000).optional(),
  plainExplanation: z.string().trim().min(10).max(4000).optional(),
  steps: z.array(z.string().trim().min(1).max(500)).max(30).nullable().optional(),
  requiredDocuments: z.array(z.string().trim().min(1).max(240)).max(50).nullable().optional(),
  feesNote: z.string().trim().max(2000).nullable().optional(),
  effectiveAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  sourceUrl: z.string().url().optional(),
  evidenceIds: evidenceIdsSchema.optional()
}));
export type UpdatePolicyInput = z.infer<typeof updatePolicySchema>;

export const updatePolicyNewsSchema = atLeastOneField(z.object({
  category: z.string().trim().min(2).max(80).optional(),
  title: z.string().trim().min(3).max(240).optional(),
  summary: z.string().trim().min(10).max(4000).optional(),
  impactSummary: z.string().trim().min(10).max(4000).optional(),
  originalLanguage: z.string().trim().min(2).max(32).nullable().optional(),
  sourceUrl: z.string().url().optional(),
  sourceSystem: sourceSystemSchema.optional(),
  sourceRef: z.string().trim().min(2).max(240).optional(),
  observedAt: z.string().datetime().optional(),
  publishedAt: z.string().datetime().nullable().optional(),
  effectiveAt: z.string().datetime().nullable().optional(),
  relatedPolicyId: z.string().cuid().nullable().optional(),
  evidenceIds: evidenceIdsSchema.optional()
}));
export type UpdatePolicyNewsInput = z.infer<typeof updatePolicyNewsSchema>;

export const updateEligibilitySchema = atLeastOneField(z.object({
  vehicleModelId: z.string().cuid().optional(),
  eligible: z.boolean().nullable().optional(),
  restrictions: z.record(z.unknown()).nullable().optional(),
  evidenceIds: evidenceIdsSchema.optional()
}));
export type UpdateEligibilityInput = z.infer<typeof updateEligibilitySchema>;

export const updateSupplierSchema = atLeastOneField(z.object({
  legalName: z.string().trim().min(2).max(240).optional(),
  displayName: z.string().trim().min(2).max(160).optional(),
  countryCode: z.string().trim().length(2).transform((value) => value.toUpperCase()).optional(),
  contactName: z.string().trim().max(160).nullable().optional(),
  contactEmail: z.string().email().nullable().optional(),
  contactPhone: z.string().trim().max(60).nullable().optional()
}));
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;

export const updateSupplierCapabilitySchema = atLeastOneField(z.object({
  supplierId: z.string().cuid().optional(),
  score: z.number().int().min(0).max(100).nullable().optional(),
  dimensions: z.record(z.unknown()).nullable().optional(),
  routes: z.record(z.unknown()).nullable().optional(),
  evidenceIds: evidenceIdsSchema.optional()
}));
export type UpdateSupplierCapabilityInput = z.infer<typeof updateSupplierCapabilitySchema>;

export const updatePriceObservationSchema = atLeastOneField(z.object({
  vehicleModelId: z.string().cuid().optional(),
  amount: z.number().positive().optional(),
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()).optional(),
  incoterm: z.string().trim().min(2).max(20).transform((value) => value.toUpperCase()).optional(),
  observedAt: z.string().datetime().optional(),
  validUntil: z.string().datetime().nullable().optional(),
  sourceSystem: sourceSystemSchema.optional(),
  sourceRef: z.string().trim().min(2).max(240).optional(),
  evidenceIds: evidenceIdsSchema.optional()
}));
export type UpdatePriceObservationInput = z.infer<typeof updatePriceObservationSchema>;

export type TrustedDataUpdateInput =
  | z.infer<typeof updateEvidenceSchema>
  | z.infer<typeof updatePolicySchema>
  | z.infer<typeof updatePolicyNewsSchema>
  | z.infer<typeof updateEligibilitySchema>
  | z.infer<typeof updateSupplierSchema>
  | z.infer<typeof updateSupplierCapabilitySchema>
  | z.infer<typeof updatePriceObservationSchema>;

export const trustedDataTransitionSchema = z.object({
  to: reviewStateSchema,
  reason: z.string().trim().min(3).max(1000)
});
export type TrustedDataTransitionInput = z.infer<typeof trustedDataTransitionSchema>;

export const reviewTaskTypeValues = [
  "EVIDENCE",
  "POLICY",
  "POLICY_NEWS",
  "PRICE_OBSERVATION",
  "DECISION",
  "REPORT",
  "PAYMENT",
  "SYNC_EXCEPTION"
] as const;
export const reviewTaskTypeSchema = z.enum(reviewTaskTypeValues);
export type ReviewTaskType = z.infer<typeof reviewTaskTypeSchema>;

export const reviewTaskListQuerySchema = z.object({
  marketCode: marketCodeSchema.default("DZ"),
  status: z.enum(["OPEN", "COMPLETED", "ALL"]).default("OPEN"),
  type: z.union([reviewTaskTypeSchema, z.literal("ALL")]).default("ALL"),
  query: ledgerSearchSchema,
  limit: ledgerLimitSchema,
  cursor: ledgerCursorSchema
});
export type ReviewTaskListQuery = z.infer<typeof reviewTaskListQuerySchema>;

export type LedgerFilterOption<T extends string = string> = {
  value: T;
  count: number;
};

export type CursorPage<T, TFilterMeta> = {
  items: T[];
  pageInfo: {
    limit: number;
    hasNextPage: boolean;
    nextCursor: string | null;
  };
  filterMeta: TFilterMeta;
};

export type TrustedDataFilterMeta = {
  totalCount: number;
  reviewStates: LedgerFilterOption<ReviewState>[];
};

export type ReviewTaskFilterMeta = {
  totalCount: number;
  statuses: LedgerFilterOption<"OPEN" | "COMPLETED">[];
  types: LedgerFilterOption<ReviewTaskType>[];
};

export const updateReviewTaskSchema = z.object({
  assignedToId: z.string().cuid().nullable().optional(),
  status: z.literal("COMPLETED").optional(),
  resolution: z.string().trim().min(3).max(2000).optional()
}).superRefine((value, context) => {
  if (value.assignedToId === undefined && value.status === undefined) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Assignment or status is required" });
  }
  if (value.status === "COMPLETED" && !value.resolution) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Resolution is required when completing a review task", path: ["resolution"] });
  }
});
export type UpdateReviewTaskInput = z.infer<typeof updateReviewTaskSchema>;


export type TrustedDataCreateInput =
  | CreateEvidenceInput
  | CreatePolicyInput
  | CreatePolicyNewsInput
  | CreateEligibilityInput
  | CreateSupplierInput
  | CreateSupplierCapabilityInput
  | CreatePriceObservationInput;

export const reportStatusSchema = z.enum([
  "DRAFT",
  "PREVIEW_GENERATING",
  "PREVIEW_PENDING_REVIEW",
  "PREVIEW_READY",
  "VIP_REQUIRED",
  "FULL_GENERATING",
  "FULL_PENDING_REVIEW",
  "REPORT_READY",
  "GENERATION_FAILED",
  "CANCELLED"
]);
export type ReportStatus = z.infer<typeof reportStatusSchema>;
export const reportTypeSchema = z.enum(["STANDARD", "EXPERT"]);
export type ReportType = z.infer<typeof reportTypeSchema>;

export const requestOtpSchema = z.object({
  email: z.string().email(),
  marketCode: marketCodeSchema.default("DZ")
});

export const verifyOtpSchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/),
  marketCode: marketCodeSchema.default("DZ")
});

export const telegramProfileSchema = z.object({
  telegramUserId: z.string().regex(/^\d{1,20}$/),
  username: z.string().trim().min(1).max(64).optional(),
  firstName: z.string().trim().min(1).max(128).optional(),
  lastName: z.string().trim().min(1).max(128).optional(),
  languageCode: z.string().trim().min(2).max(16).optional()
});
export type TelegramProfileInput = z.infer<typeof telegramProfileSchema>;

export const claimTelegramLinkSchema = telegramProfileSchema.extend({
  token: z.string().min(32).max(256)
});
export type ClaimTelegramLinkInput = z.infer<typeof claimTelegramLinkSchema>;

export const vehicleSearchSchema = z.object({
  marketCode: marketCodeSchema.default("DZ"),
  query: z.string().trim().max(120).optional(),
  energyType: z.string().trim().max(40).optional(),
  bodyType: z.string().trim().max(40).optional()
});

export const supplierRiskSchema = z.object({
  dishonestExecutor: z.boolean().optional(),
  consumptionRestriction: z.boolean().optional(),
  abnormalOperation: z.boolean().optional(),
  seriousTaxViolation: z.boolean().optional(),
  administrativePenalty: z.boolean().optional(),
  breachRecord: z.boolean().optional(),
  severe: z.boolean().optional()
});

export const supplierScoreDimensionsSchema = z.object({
  registrationYears: z.number().nonnegative().optional(),
  registeredCapitalWanCny: z.number().nonnegative().optional(),
  employeeCount: z.number().int().nonnegative().optional(),
  usedVehicleExportQualified: z.boolean().optional(),
  newVehicleExportQualified: z.boolean().optional(),
  authorizedDealerCount: z.number().int().nonnegative().optional(),
  brands: z.array(z.string().trim().min(1).max(80)).max(100).optional(),
  risks: supplierRiskSchema.optional()
});
export type SupplierScoreDimensions = z.infer<typeof supplierScoreDimensionsSchema>;

export const supplierRecommendationQuerySchema = z.object({
  marketCode: marketCodeSchema.default("DZ"),
  query: z.string().trim().max(120).optional(),
  limit: z.coerce.number().int().min(1).max(5).default(5)
});
export type SupplierRecommendationQuery = z.infer<typeof supplierRecommendationQuerySchema>;

export const shippingQuoteQuerySchema = z.object({
  marketCode: marketCodeSchema.default("DZ"),
  originPort: z.string().trim().min(2).max(120),
  destinationPort: z.string().trim().min(2).max(120),
  containerType: z.enum(["20GP", "40GP", "40HQ"]).default("40HQ")
});
export type ShippingQuoteQuery = z.infer<typeof shippingQuoteQuerySchema>;

export const shippingQuoteMetadataSchema = z.object({
  originPort: z.string().trim().min(2).max(120),
  destinationPort: z.string().trim().min(2).max(120),
  containerType: z.enum(["20GP", "40GP", "40HQ"]),
  carrier: z.string().trim().min(2).max(160),
  cutoffAt: z.string().datetime(),
  estimatedDepartureAt: z.string().datetime(),
  transitDays: z.number().int().positive().max(180),
  oceanFreightUsd: z.number().nonnegative(),
  shortfallFeeUsd: z.number().nonnegative().optional()
});
export type ShippingQuoteMetadata = z.infer<typeof shippingQuoteMetadataSchema>;

export const paymentCurrencySchema = z.enum(["USD", "HKD", "CNY"]);
export const paymentPlanSchema = z.enum(["MONTHLY", "ANNUAL"]);

export const createPaymentOrderSchema = z.object({
  marketCode: marketCodeSchema.default("DZ"),
  plan: paymentPlanSchema,
  currency: paymentCurrencySchema,
  destinationId: z.string().cuid()
});
export type CreatePaymentOrderInput = z.infer<typeof createPaymentOrderSchema>;

export const createPaymentDestinationSchema = z.object({
  label: z.string().trim().min(2).max(120),
  bankName: z.string().trim().min(2).max(160),
  beneficiaryName: z.string().trim().min(2).max(200),
  accountNumber: z.string().trim().min(4).max(100),
  swiftCode: z.string().trim().min(8).max(11).optional(),
  bankAddress: z.string().trim().max(500).optional(),
  currencies: z.array(paymentCurrencySchema).min(1),
  instructions: z.string().trim().max(2000).optional()
});
export type CreatePaymentDestinationInput = z.infer<typeof createPaymentDestinationSchema>;

export const updatePaymentDestinationSchema = z.object({ isActive: z.boolean() });
export type UpdatePaymentDestinationInput = z.infer<typeof updatePaymentDestinationSchema>;

export const createExchangeRateSchema = z.object({
  quoteCurrency: z.enum(["HKD", "CNY"]),
  rate: z.number().positive(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional()
});
export type CreateExchangeRateInput = z.infer<typeof createExchangeRateSchema>;

export const reviewPaymentOrderSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT", "NEEDS_SUPPLEMENT"]),
  reason: z.string().trim().min(3).max(2000)
});
export type ReviewPaymentOrderInput = z.infer<typeof reviewPaymentOrderSchema>;

export const requestRefundSchema = z.object({
  amount: z.number().positive(),
  reason: z.string().trim().min(5).max(2000)
});
export type RequestRefundInput = z.infer<typeof requestRefundSchema>;

export const reviewRefundSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT", "COMPLETE"]),
  bankReference: z.string().trim().max(200).optional(),
  reason: z.string().trim().min(3).max(2000).optional()
});
export type ReviewRefundInput = z.infer<typeof reviewRefundSchema>;

export const updateSubscriptionSchema = z.object({
  status: z.enum(["ACTIVE", "EXPIRED", "CANCELLED"]).optional(),
  endsAt: z.string().datetime().optional()
}).refine((value) => value.status !== undefined || value.endsAt !== undefined, { message: "status or endsAt is required" });
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;

export const createDecisionSchema = z.object({
  marketCode: marketCodeSchema,
  locale: localeCodeSchema,
  question: z.string().trim().min(10).max(2000),
  vehicleModelId: z.string().cuid().optional()
});

export const createReportSchema = z.object({
  marketCode: marketCodeSchema,
  locale: localeCodeSchema,
  scope: z.string().trim().min(10).max(4000),
  reportType: reportTypeSchema.default("STANDARD"),
  vehicleModelId: z.string().cuid().optional(),
  supplierId: z.string().cuid().optional()
});
export type CreateReportInput = z.infer<typeof createReportSchema>;

export const reviewReportSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT"]),
  notes: z.string().trim().min(3).max(4000)
});
export type ReviewReportInput = z.infer<typeof reviewReportSchema>;

export const telegramConversationUpdateSchema = z.object({
  state: z.string().trim().regex(/^[A-Z0-9_]{2,64}$/),
  context: z.record(z.unknown()).default({})
});
export type TelegramConversationUpdateInput = z.infer<typeof telegramConversationUpdateSchema>;

const telegramActionBase = z.object({ telegramUserId: z.string().regex(/^\d{1,20}$/), marketCode: z.literal("DZ").default("DZ") });
export const telegramBotActionSchema = z.discriminatedUnion("action", [
  telegramActionBase.extend({ action: z.literal("DECISION"), locale: localeCodeSchema, question: z.string().trim().min(10).max(2000) }),
  telegramActionBase.extend({ action: z.literal("SUPPLIERS"), query: z.string().trim().max(120).optional() }),
  telegramActionBase.extend({ action: z.literal("SHIPPING"), originPort: z.string().trim().min(2).max(120), destinationPort: z.string().trim().min(2).max(120), containerType: z.enum(["20GP", "40GP", "40HQ"]) }),
  telegramActionBase.extend({ action: z.literal("PAYMENT_DESTINATIONS") }),
  telegramActionBase.extend({ action: z.literal("CREATE_PAYMENT_ORDER"), plan: z.enum(["MONTHLY", "ANNUAL"]), currency: z.enum(["USD", "CNY", "HKD"]), destinationId: z.string().cuid() }),
  telegramActionBase.extend({ action: z.literal("PAYMENT_ORDERS") }),
  telegramActionBase.extend({ action: z.literal("REPORTS") }),
  telegramActionBase.extend({ action: z.literal("CREATE_REPORT"), locale: localeCodeSchema, reportType: reportTypeSchema, scope: z.string().trim().min(10).max(4000) }),
  telegramActionBase.extend({ action: z.literal("REPORT_DOWNLOAD"), reportId: z.string().cuid() })
]);
export type TelegramBotActionInput = z.infer<typeof telegramBotActionSchema>;

export const orderLookupSchema = z.object({
  marketCode: marketCodeSchema,
  pi: z.string().trim().max(120).optional(),
  vin: z.string().trim().max(40).optional()
}).refine((value) => value.pi || value.vin, { message: "pi or vin is required" });

export type ApiEnvelope<T> = {
  data: T | null;
  error: { code: string; message: string; details?: unknown } | null;
  requestId: string;
};

export type SessionUser = {
  id: string;
  email: string;
  organizationId: string;
  role: UserRole;
  marketScopes: MarketCode[];
};

export type DecisionAnswer = {
  conclusion: string;
  reasons: string[];
  risks: string[];
  missingInformation: string[];
  nextActions: string[];
  citations: Array<{
    evidenceId: string;
    title: string;
    sourceDate: string;
  }>;
  confidence: number;
  reviewRequired: boolean;
};
