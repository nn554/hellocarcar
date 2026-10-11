-- Add analyst/admin market assignments.
CREATE TABLE "MembershipMarketScope" (
    "id" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    CONSTRAINT "MembershipMarketScope_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MembershipMarketScope_membershipId_marketId_key"
ON "MembershipMarketScope"("membershipId", "marketId");

CREATE INDEX "MembershipMarketScope_marketId_idx"
ON "MembershipMarketScope"("marketId");

ALTER TABLE "MembershipMarketScope"
ADD CONSTRAINT "MembershipMarketScope_membershipId_fkey"
FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MembershipMarketScope"
ADD CONSTRAINT "MembershipMarketScope_marketId_fkey"
FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Record the reviewer directly on every trusted-data resource.
ALTER TABLE "Evidence" ADD COLUMN "reviewedById" TEXT, ADD COLUMN "reviewedAt" TIMESTAMP(3);
ALTER TABLE "PriceObservation" ADD COLUMN "reviewedById" TEXT, ADD COLUMN "reviewedAt" TIMESTAMP(3);
ALTER TABLE "Supplier" ADD COLUMN "reviewedById" TEXT, ADD COLUMN "reviewedAt" TIMESTAMP(3);
ALTER TABLE "SupplierMarketCapability" ADD COLUMN "reviewedById" TEXT;
ALTER TABLE "CountryPolicy" ADD COLUMN "reviewedById" TEXT;
ALTER TABLE "VehicleMarketEligibility" ADD COLUMN "reviewedById" TEXT, ADD COLUMN "reviewedAt" TIMESTAMP(3);

ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PriceObservation" ADD CONSTRAINT "PriceObservation_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupplierMarketCapability" ADD CONSTRAINT "SupplierMarketCapability_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CountryPolicy" ADD CONSTRAINT "CountryPolicy_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "VehicleMarketEligibility" ADD CONSTRAINT "VehicleMarketEligibility_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
