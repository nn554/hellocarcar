export type Role = "BUYER" | "ANALYST" | "FINANCE" | "CUSTOMER_SERVICE" | "REVIEWER" | "ADMIN";
export type ReviewState = "DRAFT" | "PENDING_REVIEW" | "VERIFIED" | "REJECTED" | "EXPIRED" | "NEEDS_LOCAL_CONFIRMATION";
export type ReviewTaskType = "EVIDENCE" | "POLICY" | "POLICY_NEWS" | "PRICE_OBSERVATION" | "DECISION" | "REPORT" | "PAYMENT" | "SYNC_EXCEPTION";
export type ReviewTaskStatusFilter = "OPEN" | "COMPLETED" | "ALL";
export type TrustedResource = "evidence" | "policies" | "policy-news" | "eligibility" | "suppliers" | "supplier-capabilities" | "price-observations";
export type ViewKey = "dashboard" | "review-tasks" | "payments" | TrustedResource;

export type SessionUser = {
  id: string;
  email: string;
  organizationId: string;
  role: Role;
  marketScopes: string[];
};

export type Person = { id: string; email: string; displayName: string | null; role?: Role };
export type VehicleOption = { id: string; make: string; name: string; modelYear: number | null };
export type EvidenceOption = { id: string; title: string; reviewState: ReviewState; validUntil: string | null };
export type SupplierOption = { id: string; legalName: string; displayName: string; reviewState: ReviewState };

export type WorkspaceOptions = {
  market: { id: string; code: string; name: string; status: string };
  vehicleModels: VehicleOption[];
  evidence: EvidenceOption[];
  suppliers: SupplierOption[];
  assignees: Person[];
};

export type TrustedRecord = {
  id: string;
  reviewState: ReviewState;
  title?: string;
  kind?: string;
  sourceSystem?: string;
  sourceRef?: string;
  sourceUrl?: string | null;
  observedAt?: string;
  validUntil?: string | null;
  contentHash?: string;
  metadata?: unknown;
  category?: string;
  summary?: string;
  plainExplanation?: string | null;
  steps?: unknown;
  requiredDocuments?: unknown;
  feesNote?: string | null;
  impactSummary?: string;
  originalLanguage?: string | null;
  publishedAt?: string | null;
  effectiveAt?: string | null;
  expiresAt?: string | null;
  vehicleModelId?: string;
  vehicleModel?: VehicleOption;
  eligible?: boolean | null;
  restrictions?: unknown;
  legalName?: string;
  displayName?: string;
  countryCode?: string;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  capabilities?: unknown[];
  supplierId?: string;
  supplier?: SupplierOption;
  score?: number | null;
  dimensions?: unknown;
  routes?: unknown;
  amount?: string | number;
  currency?: string;
  incoterm?: string;
  evidenceLinks?: Array<{ evidence: EvidenceOption }>;
  reviewedBy?: Person | null;
  reviewedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ReviewTask = {
  id: string;
  type: ReviewTaskType;
  entityType: string;
  entityId: string;
  reason: string;
  status: "OPEN" | "COMPLETED";
  assignedToId: string | null;
  completedById: string | null;
  assignedTo: Person | null;
  completedBy: Person | null;
  resolution: string | null;
  createdAt: string;
  completedAt: string | null;
};

export type ReportReviewDetail = {
  id: string;
  locale: string;
  scope: string;
  reportType: "STANDARD" | "EXPERT";
  status: string;
  isMasked: boolean;
  createdAt: string;
  updatedAt: string;
  market: { code: string; name: string };
  organization: { id: string; name: string };
  requester: Person;
  vehicleModel: VehicleOption | null;
  supplier: { id: string; displayName: string; legalName: string } | null;
  versions: Array<{ id: string; version: number; masked: boolean; createdAt: string }>;
  reviews: Array<{ id: string; state: ReviewState; notes: string | null; createdAt: string; reviewer: Person }>;
  reviewTask: ReviewTask | null;
};

export type LedgerFilterOption<T extends string = string> = { value: T; count: number };
export type CursorPage<T, TFilterMeta> = {
  items: T[];
  pageInfo: { limit: number; hasNextPage: boolean; nextCursor: string | null };
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

export type FieldDefinition = {
  name: string;
  label: string;
  kind: "text" | "textarea" | "number" | "datetime" | "select" | "multi" | "json";
  required?: boolean;
  nullable?: boolean;
  options?: Array<{ value: string; label: string }>;
  optionSource?: "vehicles" | "evidence" | "suppliers";
  rows?: number;
};

export type ResourceDefinition = {
  key: TrustedResource;
  label: string;
  shortLabel: string;
  eyebrow: string;
  fields: FieldDefinition[];
};

const sourceOptions = [
  { value: "MANUAL", label: "人工录入" },
  { value: "PUBLIC_SOURCE", label: "公开来源" },
  { value: "FEISHU", label: "飞书只读来源" },
  { value: "NBS", label: "NBS 只读来源" }
];

export const resources: ResourceDefinition[] = [
  {
    key: "evidence", label: "证据资料", shortLabel: "证据", eyebrow: "Evidence",
    fields: [
      { name: "kind", label: "证据类型", kind: "text", required: true },
      { name: "title", label: "标题", kind: "text", required: true },
      { name: "sourceSystem", label: "来源系统", kind: "select", required: true, options: sourceOptions },
      { name: "sourceRef", label: "来源编号", kind: "text", required: true },
      { name: "sourceUrl", label: "来源链接", kind: "text", nullable: true },
      { name: "observedAt", label: "采集时间", kind: "datetime", required: true },
      { name: "validUntil", label: "有效期至", kind: "datetime", nullable: true },
      { name: "contentHash", label: "内容哈希", kind: "text", required: true },
      { name: "metadata", label: "补充信息 JSON", kind: "json", nullable: true, rows: 5 }
    ]
  },
  {
    key: "policies", label: "政策规则", shortLabel: "政策", eyebrow: "Policy",
    fields: [
      { name: "category", label: "政策分类", kind: "text", required: true },
      { name: "title", label: "标题", kind: "text", required: true },
      { name: "summary", label: "摘要", kind: "textarea", required: true, rows: 5 },
      { name: "plainExplanation", label: "通俗解释", kind: "textarea", nullable: true, rows: 4 },
      { name: "steps", label: "办理步骤 JSON 数组", kind: "json", nullable: true, rows: 4 },
      { name: "requiredDocuments", label: "所需文件 JSON 数组", kind: "json", nullable: true, rows: 4 },
      { name: "feesNote", label: "费用提示", kind: "textarea", nullable: true, rows: 3 },
      { name: "effectiveAt", label: "生效时间", kind: "datetime", required: true },
      { name: "expiresAt", label: "失效时间", kind: "datetime", nullable: true },
      { name: "sourceUrl", label: "政策原文链接", kind: "text", required: true },
      { name: "evidenceIds", label: "关联证据", kind: "multi", required: true, optionSource: "evidence" }
    ]
  },
  {
    key: "policy-news", label: "政策速报", shortLabel: "政策速报", eyebrow: "Policy News",
    fields: [
      { name: "category", label: "政策分类", kind: "text", required: true },
      { name: "title", label: "速报标题", kind: "text", required: true },
      { name: "summary", label: "发生了什么", kind: "textarea", required: true, rows: 4 },
      { name: "impactSummary", label: "对进口商的影响", kind: "textarea", required: true, rows: 4 },
      { name: "originalLanguage", label: "原文语言", kind: "text", nullable: true },
      { name: "sourceUrl", label: "原文链接", kind: "text", required: true },
      { name: "sourceSystem", label: "来源系统", kind: "select", required: true, options: sourceOptions },
      { name: "sourceRef", label: "来源编号", kind: "text", required: true },
      { name: "observedAt", label: "发现时间", kind: "datetime", required: true },
      { name: "publishedAt", label: "发布时间", kind: "datetime", nullable: true },
      { name: "effectiveAt", label: "生效时间", kind: "datetime", nullable: true },
      { name: "relatedPolicyId", label: "关联基础政策 ID", kind: "text", nullable: true },
      { name: "evidenceIds", label: "关联证据", kind: "multi", required: true, optionSource: "evidence" }
    ]
  },
  {
    key: "eligibility", label: "车型准入", shortLabel: "准入", eyebrow: "Eligibility",
    fields: [
      { name: "vehicleModelId", label: "车型", kind: "select", required: true, optionSource: "vehicles" },
      { name: "eligible", label: "准入结论", kind: "select", options: [
        { value: "true", label: "允许" }, { value: "false", label: "不允许" }, { value: "", label: "待确认" }
      ] },
      { name: "restrictions", label: "限制条件 JSON", kind: "json", nullable: true, rows: 5 },
      { name: "evidenceIds", label: "关联证据", kind: "multi", required: true, optionSource: "evidence" }
    ]
  },
  {
    key: "suppliers", label: "供应商", shortLabel: "供应商", eyebrow: "Supplier",
    fields: [
      { name: "legalName", label: "法定名称", kind: "text", required: true },
      { name: "displayName", label: "显示名称", kind: "text", required: true },
      { name: "countryCode", label: "国家代码", kind: "text", required: true },
      { name: "contactName", label: "联系人", kind: "text", nullable: true },
      { name: "contactEmail", label: "联系邮箱", kind: "text", nullable: true },
      { name: "contactPhone", label: "联系电话", kind: "text", nullable: true }
    ]
  },
  {
    key: "supplier-capabilities", label: "供应能力", shortLabel: "供应能力", eyebrow: "Capability",
    fields: [
      { name: "supplierId", label: "供应商", kind: "select", required: true, optionSource: "suppliers" },
      { name: "score", label: "能力评分", kind: "number", nullable: true },
      { name: "dimensions", label: "能力维度 JSON", kind: "json", nullable: true, rows: 5 },
      { name: "routes", label: "物流路线 JSON", kind: "json", nullable: true, rows: 5 },
      { name: "evidenceIds", label: "关联证据", kind: "multi", required: true, optionSource: "evidence" }
    ]
  },
  {
    key: "price-observations", label: "价格观察", shortLabel: "价格", eyebrow: "Price",
    fields: [
      { name: "vehicleModelId", label: "车型", kind: "select", required: true, optionSource: "vehicles" },
      { name: "amount", label: "金额", kind: "number", required: true },
      { name: "currency", label: "币种", kind: "text", required: true },
      { name: "incoterm", label: "贸易术语", kind: "text", required: true },
      { name: "observedAt", label: "观察时间", kind: "datetime", required: true },
      { name: "validUntil", label: "有效期至", kind: "datetime", nullable: true },
      { name: "sourceSystem", label: "来源系统", kind: "select", required: true, options: sourceOptions },
      { name: "sourceRef", label: "来源编号", kind: "text", required: true },
      { name: "evidenceIds", label: "关联证据", kind: "multi", required: true, optionSource: "evidence" }
    ]
  }
];

export const resourceByKey = Object.fromEntries(resources.map((item) => [item.key, item])) as Record<TrustedResource, ResourceDefinition>;
export const statusLabels: Record<ReviewState, string> = {
  DRAFT: "草稿", PENDING_REVIEW: "待审核", VERIFIED: "已验证", REJECTED: "已驳回",
  EXPIRED: "已过期", NEEDS_LOCAL_CONFIRMATION: "待本地确认"
};
export const reviewTaskTypeLabels: Record<ReviewTaskType, string> = {
  EVIDENCE: "证据",
  POLICY: "政策",
  POLICY_NEWS: "政策速报",
  PRICE_OBSERVATION: "价格观察",
  DECISION: "决策例外",
  REPORT: "报告例外",
  PAYMENT: "付款",
  SYNC_EXCEPTION: "同步异常"
};
export const viewLabels: Record<ViewKey, string> = {
  dashboard: "工作台", evidence: "证据资料", policies: "政策规则", "policy-news": "政策速报", eligibility: "车型准入",
  suppliers: "供应商", "supplier-capabilities": "供应能力", "price-observations": "价格观察", "review-tasks": "审核队列", payments: "支付运营"
};

export function formatDate(value: string | null | undefined) {
  if (!value) return "未设置";
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "未设置";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit"
  }).format(new Date(value));
}

export function toDateTimeInput(value: unknown) {
  if (typeof value !== "string" || !value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function recordTitle(resource: TrustedResource, record: TrustedRecord) {
  if (resource === "evidence" || resource === "policies" || resource === "policy-news") return record.title ?? record.id;
  if (resource === "eligibility" || resource === "price-observations") return record.vehicleModel ? record.vehicleModel.make + " " + record.vehicleModel.name : record.id;
  if (resource === "suppliers") return record.displayName ?? record.legalName ?? record.id;
  return record.supplier?.displayName ?? record.id;
}

export function recordDetail(resource: TrustedResource, record: TrustedRecord) {
  if (resource === "evidence") return (record.kind ?? "-") + " · " + (record.sourceSystem ?? "-") + " · " + (record.sourceRef ?? "-");
  if (resource === "policies") return (record.category ?? "-") + " · 生效 " + formatDate(record.effectiveAt);
  if (resource === "policy-news") return (record.category ?? "-") + " · 发布 " + formatDate(record.publishedAt ?? record.observedAt);
  if (resource === "eligibility") return record.eligible === null ? "结论待确认" : record.eligible ? "允许准入" : "不允许准入";
  if (resource === "suppliers") return (record.legalName ?? "-") + " · " + (record.countryCode ?? "-");
  if (resource === "supplier-capabilities") return "能力评分 " + (record.score ?? "未评分");
  return (record.currency ?? "-") + " " + (record.amount ?? "-") + " · " + (record.incoterm ?? "-");
}
