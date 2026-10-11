import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@hellocarcar/db";
import { PrismaService } from "../database/prisma.service";
import { MarketAccessService } from "../markets/market-access.service";

@Injectable()
export class VehiclesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService, @Inject(MarketAccessService) private readonly marketAccess: MarketAccessService) {}

  async search(input: { marketCode: string; query?: string; energyType?: string; bodyType?: string }) {
    const market = await this.marketAccess.getMarket(input.marketCode);
    const now = new Date();
    const currentVerifiedEvidence = {
      marketId: market.id,
      reviewState: "VERIFIED" as const,
      reviewedById: { not: null },
      observedAt: { lte: now },
      OR: [{ validUntil: null }, { validUntil: { gt: now } }]
    };
    const where: Prisma.VehicleModelWhereInput = {
      ...(input.energyType ? { energyType: input.energyType } : {}),
      ...(input.bodyType ? { bodyType: input.bodyType } : {}),
      ...(input.query ? {
        OR: [
          { make: { contains: input.query, mode: "insensitive" } },
          { name: { contains: input.query, mode: "insensitive" } },
          { aliases: { some: { alias: { contains: input.query, mode: "insensitive" } } } }
        ]
      } : {}),
      priceObservations: { some: {
        marketId: market.id,
        reviewState: "VERIFIED",
        reviewedById: { not: null },
        observedAt: { lte: now },
        OR: [{ validUntil: null }, { validUntil: { gt: now } }],
        evidenceLinks: { some: { evidence: currentVerifiedEvidence } }
      } },
      eligibilityRecords: { some: {
        marketId: market.id,
        eligible: true,
        reviewState: "VERIFIED",
        reviewedById: { not: null },
        evidenceLinks: { some: { evidence: currentVerifiedEvidence } }
      } }
    };
    const records = await this.prisma.vehicleModel.findMany({
      where,
      orderBy: [{ make: "asc" }, { name: "asc" }],
      include: {
        priceObservations: {
          where: {
            marketId: market.id,
            reviewState: "VERIFIED",
            reviewedById: { not: null },
            observedAt: { lte: now },
            OR: [{ validUntil: null }, { validUntil: { gt: now } }],
            evidenceLinks: { some: { evidence: currentVerifiedEvidence } }
          },
          orderBy: { amount: "asc" }
        },
        eligibilityRecords: {
          where: {
            marketId: market.id,
            eligible: true,
            reviewState: "VERIFIED",
            reviewedById: { not: null },
            evidenceLinks: { some: { evidence: currentVerifiedEvidence } }
          }
        }
      }
    });
    return records.map((vehicle) => ({
      id: vehicle.id,
      make: vehicle.make,
      name: vehicle.name,
      energyType: vehicle.energyType,
      bodyType: vehicle.bodyType,
      seats: vehicle.seats,
      modelYear: vehicle.modelYear,
      priceRange: vehicle.priceObservations.length ? {
        from: Number(vehicle.priceObservations[0]!.amount),
        to: Number(vehicle.priceObservations[vehicle.priceObservations.length - 1]!.amount),
        currency: vehicle.priceObservations[0]!.currency,
        incoterm: vehicle.priceObservations[0]!.incoterm,
        sourceDate: vehicle.priceObservations[0]!.observedAt,
        validUntil: vehicle.priceObservations[0]!.validUntil,
        reviewState: vehicle.priceObservations[0]!.reviewState
      } : null,
      eligibility: vehicle.eligibilityRecords[0] ? {
        eligible: vehicle.eligibilityRecords[0].eligible,
        restrictions: vehicle.eligibilityRecords[0].restrictions,
        reviewState: vehicle.eligibilityRecords[0].reviewState,
        reviewedAt: vehicle.eligibilityRecords[0].reviewedAt
      } : null
    }));
  }

  async prices(id: string, marketCode: string) {
    const market = await this.marketAccess.getMarket(marketCode);
    const now = new Date();
    const vehicle = await this.prisma.vehicleModel.findUnique({ where: { id } });
    if (!vehicle) throw new NotFoundException({ code: "VEHICLE_NOT_FOUND", message: "Vehicle not found" });
    return this.prisma.priceObservation.findMany({
      where: {
        vehicleModelId: id,
        marketId: market.id,
        reviewState: "VERIFIED",
        reviewedById: { not: null },
        observedAt: { lte: now },
        OR: [{ validUntil: null }, { validUntil: { gt: now } }],
        evidenceLinks: { some: { evidence: {
          marketId: market.id,
          reviewState: "VERIFIED",
          reviewedById: { not: null },
          observedAt: { lte: now },
          OR: [{ validUntil: null }, { validUntil: { gt: now } }]
        } } }
      },
      include: { evidenceLinks: { include: { evidence: { select: { id: true, title: true, sourceUrl: true, observedAt: true, validUntil: true, reviewedAt: true } } } } },
      orderBy: { observedAt: "desc" }
    });
  }
}
