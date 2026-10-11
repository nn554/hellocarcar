ALTER TYPE "ReviewTaskType" ADD VALUE 'PRICE_OBSERVATION';

ALTER TABLE "ReviewTask" ADD COLUMN "dedupeKey" TEXT;

CREATE UNIQUE INDEX "ReviewTask_dedupeKey_key" ON "ReviewTask"("dedupeKey");
