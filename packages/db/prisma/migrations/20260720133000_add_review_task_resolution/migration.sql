ALTER TABLE "ReviewTask"
ADD COLUMN "completedById" TEXT,
ADD COLUMN "resolution" TEXT,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "ReviewTask_assignedToId_status_idx" ON "ReviewTask"("assignedToId", "status");

ALTER TABLE "ReviewTask"
ADD CONSTRAINT "ReviewTask_assignedToId_fkey"
FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ReviewTask"
ADD CONSTRAINT "ReviewTask_completedById_fkey"
FOREIGN KEY ("completedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
