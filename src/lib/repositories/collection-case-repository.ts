import type {
  CollectionCase,
  CollectionCaseDraft,
  CollectionCaseId,
  CollectionCaseStatus,
  CollectionStage,
  CollectionRiskLevel,
  CollectionCaseCreateData,
  InvoiceId,
} from "../domain";
import { prisma } from "../db";
import type { PaginatedResult, PaginationParams, RepositoryContext } from "./types";

export interface ListCollectionCasesParams {
  status?: CollectionCaseStatus[];
  stage?: CollectionStage[];
  riskLevel?: CollectionRiskLevel[];
  invoiceId?: InvoiceId;
  search?: string;
  pagination?: PaginationParams;
}

export interface CollectionCaseRepository {
  findById(context: RepositoryContext, id: CollectionCaseId): Promise<CollectionCase | null>;
  findByInvoice(context: RepositoryContext, invoiceId: InvoiceId): Promise<CollectionCase | null>;
  list(context: RepositoryContext, params?: ListCollectionCasesParams): Promise<PaginatedResult<CollectionCase>>;
  create(context: RepositoryContext, data: CollectionCaseCreateData): Promise<CollectionCase>;
  update(
    context: RepositoryContext,
    id: CollectionCaseId,
    patch: Partial<Omit<CollectionCaseDraft, "organizationId" | "invoiceId">> & {
      lastCommunicationAt?: Date;
      lastAgentActionAt?: Date;
      escalationAt?: Date;
      closedAt?: Date;
    },
  ): Promise<CollectionCase>;
  setStage(context: RepositoryContext, id: CollectionCaseId, stage: CollectionStage): Promise<CollectionCase>;
  setStatus(context: RepositoryContext, id: CollectionCaseId, status: CollectionCaseStatus): Promise<CollectionCase>;
}

function mapPrismaToDomain(prismaModel: {
  id: string;
  organizationId: string;
  invoiceId: string;
  primaryContactId: string | null;
  stage: string;
  status: string;
  riskLevel: string | null;
  lastCommunicationAt: Date | null;
  nextActionAt: Date | null;
  lastAgentActionAt: Date | null;
  escalationAt: Date | null;
  closedAt: Date | null;
  summary: string | null;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}): CollectionCase {
  return {
    id: prismaModel.id as CollectionCaseId,
    organizationId: prismaModel.organizationId,
    invoiceId: prismaModel.invoiceId,
    primaryContactId: prismaModel.primaryContactId ?? undefined,
    stage: prismaModel.stage as CollectionStage,
    status: prismaModel.status as CollectionCaseStatus,
    riskLevel: (prismaModel.riskLevel ?? "MEDIUM") as CollectionRiskLevel,
    lastCommunicationAt: prismaModel.lastCommunicationAt ?? undefined,
    nextActionAt: prismaModel.nextActionAt ?? undefined,
    lastAgentActionAt: prismaModel.lastAgentActionAt ?? undefined,
    escalationAt: prismaModel.escalationAt ?? undefined,
    closedAt: prismaModel.closedAt ?? undefined,
    summary: prismaModel.summary ?? undefined,
    metadata: prismaModel.metadata ?? undefined,
    createdAt: prismaModel.createdAt,
    updatedAt: prismaModel.updatedAt,
  };
}

export function createCollectionCaseRepository(): CollectionCaseRepository {
  return {
    async findById(context, id) {
      const result = await prisma.collectionCase.findFirst({
        where: {
          id,
          organizationId: context.organizationId,
        },
      });
      return result ? mapPrismaToDomain(result) : null;
    },

    async findByInvoice(context, invoiceId) {
      const result = await prisma.collectionCase.findFirst({
        where: {
          invoiceId,
          organizationId: context.organizationId,
        },
      });
      return result ? mapPrismaToDomain(result) : null;
    },

    async list(context, params) {
      const limit = params?.pagination?.limit ?? 50;
      const cursor = params?.pagination?.cursor;

      const where: any = {
        organizationId: context.organizationId,
      };

      if (params?.invoiceId) {
        where.invoiceId = params.invoiceId;
      }

      if (params?.status && params.status.length > 0) {
        where.status = { in: params.status };
      }

      if (params?.stage && params.stage.length > 0) {
        where.stage = { in: params.stage };
      }

      if (params?.riskLevel && params.riskLevel.length > 0) {
        where.riskLevel = { in: params.riskLevel };
      }

      if (params?.search) {
        where.summary = { contains: params.search, mode: "insensitive" };
      }

      const [data, totalCount] = await Promise.all([
        prisma.collectionCase.findMany({
          where,
          take: limit + 1,
          cursor: cursor ? { id: cursor } : undefined,
          orderBy: { createdAt: "desc" },
        }),
        prisma.collectionCase.count({ where }),
      ]);

      const hasNextPage = data.length > limit;
      const items = hasNextPage ? data.slice(0, limit) : data;
      const nextCursor = hasNextPage && items.length > 0 ? items[items.length - 1]!.id : null;

      return {
        data: items.map(mapPrismaToDomain),
        nextCursor,
        totalCount,
      };
    },

    async create(context, data) {
      const result = await prisma.collectionCase.create({
        data: {
          organizationId: context.organizationId,
          invoiceId: data.invoiceId,
          primaryContactId: data.primaryContactId,
          stage: data.stage ?? "INITIAL",
          status: data.status ?? "ACTIVE",
          riskLevel: data.riskLevel ?? "MEDIUM",
          nextActionAt: data.nextActionAt,
          summary: data.summary,
          metadata: data.metadata as any,
        },
      });
      return mapPrismaToDomain(result);
    },

    async update(context, id, patch) {
      const updateData: any = {};
      if (patch.primaryContactId !== undefined) updateData.primaryContactId = patch.primaryContactId;
      if (patch.stage !== undefined) updateData.stage = patch.stage;
      if (patch.status !== undefined) {
        updateData.status = patch.status;
        if (patch.status === "CLOSED") {
          updateData.closedAt = new Date();
        }
      }
      if (patch.riskLevel !== undefined) updateData.riskLevel = patch.riskLevel;
      if (patch.lastCommunicationAt !== undefined) updateData.lastCommunicationAt = patch.lastCommunicationAt;
      if (patch.nextActionAt !== undefined) updateData.nextActionAt = patch.nextActionAt;
      if (patch.lastAgentActionAt !== undefined) updateData.lastAgentActionAt = patch.lastAgentActionAt;
      if (patch.escalationAt !== undefined) updateData.escalationAt = patch.escalationAt;
      if (patch.summary !== undefined) updateData.summary = patch.summary;
      if (patch.metadata !== undefined) updateData.metadata = patch.metadata as any;

      const result = await prisma.collectionCase.update({
        where: {
          id,
          organizationId: context.organizationId,
        },
        data: updateData,
      });
      return mapPrismaToDomain(result);
    },

    async setStage(context, id, stage) {
      const result = await prisma.collectionCase.update({
        where: {
          id,
          organizationId: context.organizationId,
        },
        data: { stage },
      });
      return mapPrismaToDomain(result);
    },

    async setStatus(context, id, status) {
      const updateData: any = { status };
      if (status === "CLOSED") {
        updateData.closedAt = new Date();
      }
      const result = await prisma.collectionCase.update({
        where: {
          id,
          organizationId: context.organizationId,
        },
        data: updateData,
      });
      return mapPrismaToDomain(result);
    },
  };
}
