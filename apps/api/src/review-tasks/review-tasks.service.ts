import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { reviewTaskTypeValues } from "@hellocarcar/contracts";
import type { ReviewTaskListQuery, SessionUser, UpdateReviewTaskInput } from "@hellocarcar/contracts";
import { Prisma } from "@hellocarcar/db";
import { decodeLedgerCursor, toCursorPage } from "../common/ledger-pagination";
import { PrismaService } from "../database/prisma.service";
import { MarketAccessService } from "../markets/market-access.service";

@Injectable()
export class ReviewTasksService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(MarketAccessService) private readonly marketAccess: MarketAccessService
  ) {}

  private async requireMarket(user: SessionUser, marketCode: string) {
    const market = await this.marketAccess.getMarket(marketCode);
    if (user.role !== "ADMIN" && !user.marketScopes.includes(market.code as "DZ" | "IR")) {
      throw new ForbiddenException({ code: "MARKET_ASSIGNMENT_REQUIRED", message: "This analyst is not assigned to the requested market" });
    }
    return market;
  }

  async list(user: SessionUser, input: ReviewTaskListQuery) {
    const market = await this.requireMarket(user, input.marketCode);
    const cursorScope = JSON.stringify(["review-tasks", market.id, input.status, input.type, input.query ?? ""]);
    const cursorId = decodeLedgerCursor(input.cursor, cursorScope);
    const cursor: { cursor?: { id: string }; skip?: number } = cursorId ? { cursor: { id: cursorId }, skip: 1 } : {};
    const baseWhere: Prisma.ReviewTaskWhereInput = {
      marketId: market.id,
      ...(input.query ? { OR: [
        { reason: { contains: input.query, mode: "insensitive" } },
        { entityType: { contains: input.query, mode: "insensitive" } },
        { entityId: { contains: input.query, mode: "insensitive" } }
      ] } : {})
    };
    const statusFilter = input.status === "ALL" ? {} : { status: input.status };
    const typeFilter = input.type === "ALL" ? {} : { type: input.type };
    const where: Prisma.ReviewTaskWhereInput = { ...baseWhere, ...statusFilter, ...typeFilter };
    const [rows, totalCount, statusGroups, typeGroups] = await Promise.all([
      this.prisma.reviewTask.findMany({
        where,
        include: {
          assignedTo: { select: { id: true, email: true, displayName: true } },
          completedBy: { select: { id: true, email: true, displayName: true } }
        },
        orderBy: [{ status: "asc" }, { createdAt: "desc" }, { id: "desc" }],
        take: input.limit + 1,
        ...cursor
      }),
      this.prisma.reviewTask.count({ where }),
      this.prisma.reviewTask.groupBy({ by: ["status"], where: { ...baseWhere, ...typeFilter }, _count: { _all: true } }),
      this.prisma.reviewTask.groupBy({ by: ["type"], where: { ...baseWhere, ...statusFilter }, _count: { _all: true } })
    ]);
    const statuses = (["OPEN", "COMPLETED"] as const).map((value) => ({
      value,
      count: statusGroups.find((group) => group.status === value)?._count._all ?? 0
    }));
    const types = reviewTaskTypeValues.map((value) => ({
      value,
      count: typeGroups.find((group) => group.type === value)?._count._all ?? 0
    }));
    return toCursorPage(rows, input.limit, cursorScope, { totalCount, statuses, types });
  }

  async update(user: SessionUser, id: string, marketCode: string, input: UpdateReviewTaskInput) {
    const market = await this.requireMarket(user, marketCode);
    const task = await this.prisma.reviewTask.findFirst({ where: { id, marketId: market.id } });
    if (!task) throw new NotFoundException({ code: "REVIEW_TASK_NOT_FOUND", message: "Review task not found in this market" });
    if (task.status !== "OPEN") {
      throw new BadRequestException({ code: "REVIEW_TASK_CLOSED", message: "Completed review tasks cannot be changed" });
    }

    if (input.assignedToId) {
      const assignee = await this.prisma.membership.findFirst({
        where: { userId: input.assignedToId, organizationId: user.organizationId, role: "ADMIN" },
        select: { userId: true }
      });
      if (!assignee) {
        throw new BadRequestException({ code: "INVALID_REVIEW_ASSIGNEE", message: "Review tasks must be assigned to an administrator in this organization" });
      }
    }

    const effectiveAssignee = input.assignedToId === undefined ? task.assignedToId : input.assignedToId;
    if (input.status === "COMPLETED" && effectiveAssignee && effectiveAssignee !== user.id) {
      throw new ForbiddenException({ code: "REVIEW_TASK_ASSIGNED_TO_ANOTHER", message: "Only the assigned reviewer can complete this task" });
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.reviewTask.update({
        where: { id },
        data: {
          ...(input.assignedToId !== undefined ? { assignedToId: input.assignedToId } : {}),
          ...(input.status === "COMPLETED" ? {
            status: "COMPLETED",
            resolution: input.resolution,
            completedAt: new Date(),
            completedById: user.id
          } : {})
        },
        include: {
          assignedTo: { select: { id: true, email: true, displayName: true } },
          completedBy: { select: { id: true, email: true, displayName: true } }
        }
      });
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: input.status === "COMPLETED" ? "REVIEW_TASK_COMPLETED" : "REVIEW_TASK_ASSIGNED",
          entityType: "ReviewTask",
          entityId: id,
          marketCode,
          metadata: {
            ...(input.assignedToId !== undefined ? { assignedToId: input.assignedToId } : {}),
            ...(input.resolution ? { resolution: input.resolution } : {})
          }
        }
      });
      return updated;
    });
  }
}
