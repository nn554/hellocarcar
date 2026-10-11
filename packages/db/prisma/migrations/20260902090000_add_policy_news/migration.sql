-- Extend trusted policy content with plain-language guidance and reviewed news.
ALTER TYPE "ReviewTaskType" ADD VALUE IF NOT EXISTS 'POLICY_NEWS';

ALTER TABLE "CountryPolicy"
  ADD COLUMN IF NOT EXISTS "plainExplanation" TEXT,
  ADD COLUMN IF NOT EXISTS "steps" JSONB,
  ADD COLUMN IF NOT EXISTS "requiredDocuments" JSONB,
  ADD COLUMN IF NOT EXISTS "feesNote" TEXT;

CREATE TABLE "PolicyNewsItem" (
  "id" TEXT NOT NULL,
  "marketId" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "impactSummary" TEXT NOT NULL,
  "originalLanguage" TEXT,
  "sourceUrl" TEXT NOT NULL,
  "sourceSystem" "SourceSystem" NOT NULL DEFAULT 'PUBLIC_SOURCE',
  "sourceRef" TEXT NOT NULL,
  "observedAt" TIMESTAMP(3) NOT NULL,
  "publishedAt" TIMESTAMP(3),
  "effectiveAt" TIMESTAMP(3),
  "reviewState" "ReviewState" NOT NULL,
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "contentHash" TEXT NOT NULL,
  "relatedPolicyId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PolicyNewsItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PolicyNewsItem_marketId_sourceRef_contentHash_key"
  ON "PolicyNewsItem"("marketId", "sourceRef", "contentHash");
CREATE INDEX "PolicyNewsItem_marketId_reviewState_observedAt_idx"
  ON "PolicyNewsItem"("marketId", "reviewState", "observedAt");
CREATE INDEX "PolicyNewsItem_marketId_publishedAt_idx"
  ON "PolicyNewsItem"("marketId", "publishedAt");

ALTER TABLE "PolicyNewsItem"
  ADD CONSTRAINT "PolicyNewsItem_marketId_fkey"
  FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PolicyNewsItem"
  ADD CONSTRAINT "PolicyNewsItem_reviewedById_fkey"
  FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PolicyNewsItem"
  ADD CONSTRAINT "PolicyNewsItem_relatedPolicyId_fkey"
  FOREIGN KEY ("relatedPolicyId") REFERENCES "CountryPolicy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EvidenceLink"
  ADD COLUMN IF NOT EXISTS "policyNewsItemId" TEXT;
CREATE INDEX "EvidenceLink_policyNewsItemId_idx" ON "EvidenceLink"("policyNewsItemId");
ALTER TABLE "EvidenceLink"
  ADD CONSTRAINT "EvidenceLink_policyNewsItemId_fkey"
  FOREIGN KEY ("policyNewsItemId") REFERENCES "PolicyNewsItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
