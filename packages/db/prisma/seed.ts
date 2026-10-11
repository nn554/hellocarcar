import { createHash } from "node:crypto";
import {
  EvidenceScope,
  LocaleDirection,
  MarketStatus,
  PrismaClient,
  ReviewState,
  SourceSystem,
  UserRole
} from "@prisma/client";

const prisma = new PrismaClient();

const hash = (value: string) => createHash("sha256").update(value).digest("hex");

async function main() {
  const dz = await prisma.market.upsert({
    where: { code: "DZ" },
    update: { status: MarketStatus.ACTIVE },
    create: {
      code: "DZ",
      name: "Algeria",
      timezone: "Africa/Algiers",
      defaultCurrency: "USD",
      status: MarketStatus.ACTIVE,
      locales: {
        create: [
          { locale: "ar-DZ", label: "العربية", direction: LocaleDirection.RTL, isDefault: true },
          { locale: "fr-DZ", label: "Français", direction: LocaleDirection.LTR },
          { locale: "en", label: "English", direction: LocaleDirection.LTR }
        ]
      }
    }
  });

  await prisma.market.upsert({
    where: { code: "IR" },
    update: {},
    create: {
      code: "IR",
      name: "Iran",
      timezone: "Asia/Tehran",
      defaultCurrency: "USD",
      status: MarketStatus.PLANNED,
      locales: {
        create: [
          { locale: "fa-IR", label: "فارسی", direction: LocaleDirection.RTL, isDefault: true },
          { locale: "en", label: "English", direction: LocaleDirection.LTR }
        ]
      }
    }
  });

  const organization = await prisma.organization.upsert({
    where: { id: "org-demo-algeria" },
    update: {},
    create: { id: "org-demo-algeria", name: "HelloCarCar Demo Buyer" }
  });

  const operationsOrganization = await prisma.organization.upsert({
    where: { id: "org-hellocarcar-operations" },
    update: {},
    create: { id: "org-hellocarcar-operations", name: "HelloCarCar Operations" }
  });

  const analyst = await prisma.user.upsert({
    where: { email: "analyst@hellocarcar.local" },
    update: { displayName: "DZ Demo Analyst", emailVerifiedAt: new Date() },
    create: { email: "analyst@hellocarcar.local", displayName: "DZ Demo Analyst", emailVerifiedAt: new Date() }
  });
  const analystMembership = await prisma.membership.upsert({
    where: { userId_organizationId: { userId: analyst.id, organizationId: operationsOrganization.id } },
    update: { role: UserRole.ANALYST },
    create: { userId: analyst.id, organizationId: operationsOrganization.id, role: UserRole.ANALYST }
  });
  await prisma.membershipMarketScope.upsert({
    where: { membershipId_marketId: { membershipId: analystMembership.id, marketId: dz.id } },
    update: {},
    create: { membershipId: analystMembership.id, marketId: dz.id }
  });

  const reviewer = await prisma.user.upsert({
    where: { email: "reviewer@hellocarcar.local" },
    update: { displayName: "Demo Admin Reviewer", emailVerifiedAt: new Date() },
    create: { email: "reviewer@hellocarcar.local", displayName: "Demo Admin Reviewer", emailVerifiedAt: new Date() }
  });
  const reviewerMembership = await prisma.membership.upsert({
    where: { userId_organizationId: { userId: reviewer.id, organizationId: operationsOrganization.id } },
    update: { role: UserRole.ADMIN },
    create: { userId: reviewer.id, organizationId: operationsOrganization.id, role: UserRole.ADMIN }
  });
  await prisma.membershipMarketScope.upsert({
    where: { membershipId_marketId: { membershipId: reviewerMembership.id, marketId: dz.id } },
    update: {},
    create: { membershipId: reviewerMembership.id, marketId: dz.id }
  });

  const buyer = await prisma.user.upsert({
    where: { email: "buyer@hellocarcar.local" },
    update: {},
    create: {
      email: "buyer@hellocarcar.local",
      displayName: "Demo Buyer",
      emailVerifiedAt: new Date(),
      memberships: {
        create: { organizationId: organization.id, role: UserRole.BUYER }
      }
    }
  });

  const vehicles = [
    { make: "AVATR", name: "AVATR 11 BEV", energyType: "EV", bodyType: "SUV", seats: 5, from: 29900, to: 34800 },
    { make: "Deepal", name: "Deepal S07 EREV", energyType: "EREV", bodyType: "SUV", seats: 5, from: 18800, to: 22400 },
    { make: "Changan", name: "Changan CS55 PLUS", energyType: "Gasoline", bodyType: "SUV", seats: 5, from: 11600, to: 14900 }
  ];

  for (const item of vehicles) {
    const vehicle = await prisma.vehicleModel.upsert({
      where: { make_name_modelYear: { make: item.make, name: item.name, modelYear: 2026 } },
      update: {},
      create: {
        make: item.make,
        name: item.name,
        modelYear: 2026,
        energyType: item.energyType,
        bodyType: item.bodyType,
        seats: item.seats
      }
    });

    const sourceRef = `seed:${vehicle.id}:fob`;
    const evidence = await prisma.evidence.upsert({
      where: {
        sourceSystem_sourceRef_contentHash: {
          sourceSystem: SourceSystem.MANUAL,
          sourceRef,
          contentHash: hash(`${item.from}-${item.to}`)
        }
      },
      update: { reviewState: ReviewState.VERIFIED, reviewedById: reviewer.id, reviewedAt: new Date("2026-07-20T00:00:00.000Z") },
      create: {
        marketId: dz.id,
        scope: EvidenceScope.MARKET,
        kind: "FOB_PRICE_RANGE",
        title: `${item.name} FOB seed evidence`,
        sourceSystem: SourceSystem.MANUAL,
        sourceRef,
        observedAt: new Date("2026-07-12T00:00:00.000Z"),
        validUntil: new Date("2026-08-12T00:00:00.000Z"),
        reviewState: ReviewState.VERIFIED,
        reviewedById: reviewer.id,
        reviewedAt: new Date("2026-07-20T00:00:00.000Z"),
        contentHash: hash(`${item.from}-${item.to}`)
      }
    });

    for (const amount of [item.from, item.to]) {
      const observation = await prisma.priceObservation.upsert({
        where: { sourceSystem_sourceRef: { sourceSystem: SourceSystem.MANUAL, sourceRef: `${sourceRef}:${amount}` } },
        update: { reviewState: ReviewState.VERIFIED, reviewedById: reviewer.id, reviewedAt: new Date("2026-07-20T00:00:00.000Z") },
        create: {
          marketId: dz.id,
          vehicleModelId: vehicle.id,
          amount,
          currency: "USD",
          incoterm: "FOB",
          observedAt: new Date("2026-07-12T00:00:00.000Z"),
          validUntil: new Date("2026-08-12T00:00:00.000Z"),
          reviewState: ReviewState.VERIFIED,
          sourceSystem: SourceSystem.MANUAL,
          sourceRef: `${sourceRef}:${amount}`,
          reviewedById: reviewer.id,
          reviewedAt: new Date("2026-07-20T00:00:00.000Z"),
          evidenceLinks: { create: { evidenceId: evidence.id } }
        }
      });
      void observation;
    }

    const eligibilitySourceRef = `seed:${vehicle.id}:dz-eligibility`;
    const eligibilityEvidence = await prisma.evidence.upsert({
      where: {
        sourceSystem_sourceRef_contentHash: {
          sourceSystem: SourceSystem.MANUAL,
          sourceRef: eligibilitySourceRef,
          contentHash: hash(`${vehicle.id}:dz:eligible`)
        }
      },
      update: { reviewState: ReviewState.VERIFIED, reviewedById: reviewer.id, reviewedAt: new Date("2026-07-20T00:00:00.000Z") },
      create: {
        marketId: dz.id,
        scope: EvidenceScope.MARKET,
        kind: "VEHICLE_ELIGIBILITY",
        title: `${item.name} Algeria eligibility seed evidence`,
        sourceSystem: SourceSystem.MANUAL,
        sourceRef: eligibilitySourceRef,
        observedAt: new Date("2026-07-12T00:00:00.000Z"),
        validUntil: new Date("2026-08-12T00:00:00.000Z"),
        reviewState: ReviewState.VERIFIED,
        reviewedById: reviewer.id,
        reviewedAt: new Date("2026-07-20T00:00:00.000Z"),
        contentHash: hash(`${vehicle.id}:dz:eligible`)
      }
    });
    const eligibility = await prisma.vehicleMarketEligibility.upsert({
      where: { marketId_vehicleModelId: { marketId: dz.id, vehicleModelId: vehicle.id } },
      update: { eligible: true, reviewState: ReviewState.VERIFIED, reviewedById: reviewer.id, reviewedAt: new Date("2026-07-20T00:00:00.000Z") },
      create: {
        marketId: dz.id,
        vehicleModelId: vehicle.id,
        eligible: true,
        restrictions: { note: "Demo seed only; replace with approved Algeria source evidence." },
        reviewState: ReviewState.VERIFIED,
        reviewedById: reviewer.id,
        reviewedAt: new Date("2026-07-20T00:00:00.000Z")
      }
    });
    const eligibilityLink = await prisma.evidenceLink.findFirst({
      where: { evidenceId: eligibilityEvidence.id, vehicleMarketEligibilityId: eligibility.id }
    });
    if (!eligibilityLink) {
      await prisma.evidenceLink.create({ data: { evidenceId: eligibilityEvidence.id, vehicleMarketEligibilityId: eligibility.id } });
    }
  }

  const avatr = await prisma.vehicleModel.findFirstOrThrow({ where: { name: "AVATR 11 BEV" } });
  const order = await prisma.pIOrder.upsert({
    where: { piNumber: "NBS-2026-AL-001" },
    update: {},
    create: {
      marketId: dz.id,
      organizationId: organization.id,
      piNumber: "NBS-2026-AL-001",
      status: "AWAITING_VESSEL",
      sourceSystem: SourceSystem.MANUAL,
      sourceRef: "seed:NBS-2026-AL-001",
      vehicles: {
        create: {
          vin: "LS5A3DCE7RA000001",
          vehicleModelId: avatr.id,
          status: "AWAITING_VESSEL",
          logisticsEvents: {
            create: [
              { code: "PURCHASE_CONFIRMED", label: "Purchase confirmed", occurredAt: new Date("2026-06-28"), sourceSystem: SourceSystem.MANUAL, visibility: "CUSTOMER" },
              { code: "LICENSE_ISSUED", label: "License issued", occurredAt: new Date("2026-07-03"), sourceSystem: SourceSystem.MANUAL, visibility: "CUSTOMER" },
              { code: "SO_GENERATED", label: "SO generated", occurredAt: new Date("2026-07-08"), sourceSystem: SourceSystem.MANUAL, visibility: "CUSTOMER" },
              { code: "LOADED_RELEASED", label: "Loaded / released", expectedAt: new Date("2026-07-22"), sourceSystem: SourceSystem.MANUAL, visibility: "CUSTOMER" }
            ]
          }
        }
      }
    }
  });

  console.log(`Seeded markets DZ/IR, buyer ${buyer.email}, order ${order.piNumber}`);
}

main().finally(async () => prisma.$disconnect());
