import type {
  AgentRun,
  AgentRunId,
  AgentRunStatus,
  AgentActionLog,
  AgentActionLogId,
  AgentActionStatus,
  AgentActionType,
  CollectionCaseId,
} from "../domain";
import { prisma } from "../db";
import type { PaginatedResult, PaginationParams, RepositoryContext } from "./types";

export interface ListAgentRunsParams {
  collectionCaseId?: CollectionCaseId;
  status?: AgentRunStatus[];
  pagination?: PaginationParams;
}

export interface AgentRunRepository {
  findById(context: RepositoryContext, id: AgentRunId): Promise<AgentRun | null>;
  list(context: RepositoryContext, params?: ListAgentRunsParams): Promise<PaginatedResult<AgentRun>>;
  create(context: RepositoryContext, payload: Omit<AgentRun, "id" | "createdAt" | "updatedAt">): Promise<AgentRun>;
  updateStatus(context: RepositoryContext, id: AgentRunId, status: AgentRunStatus, error?: string): Promise<AgentRun>;

  appendActionLog(
    context: RepositoryContext,
    payload: Omit<AgentActionLog, "id" | "createdAt" | "updatedAt">,
  ): Promise<AgentActionLog>;
  updateActionStatus(
    context: RepositoryContext,
    id: AgentActionLogId,
    status: AgentActionStatus,
    error?: string,
  ): Promise<AgentActionLog>;
  listActions(
    context: RepositoryContext,
    agentRunId: AgentRunId,
    filter?: { type?: AgentActionType[]; status?: AgentActionStatus[] },
  ): Promise<AgentActionLog[]>;
}

function mapPrismaAgentRunToDomain(prismaModel: {
  id: string;
  organizationId: string;
  collectionCaseId: string;
  status: string;
  startedAt: Date | null;
  finishedAt: Date | null;
  error: string | null;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}): AgentRun {
  return {
    id: prismaModel.id as AgentRunId,
    organizationId: prismaModel.organizationId,
    collectionCaseId: prismaModel.collectionCaseId,
    status: prismaModel.status as AgentRunStatus,
    startedAt: prismaModel.startedAt ?? undefined,
    finishedAt: prismaModel.finishedAt ?? undefined,
    error: prismaModel.error ?? undefined,
    metadata: prismaModel.metadata ?? undefined,
    createdAt: prismaModel.createdAt,
    updatedAt: prismaModel.updatedAt,
  };
}

function mapPrismaAgentActionLogToDomain(prismaModel: {
  id: string;
  organizationId: string;
  agentRunId: string;
  collectionCaseId: string;
  type: string;
  status: string;
  summary: string | null;
  payload: any;
  error: string | null;
  createdAt: Date;
  updatedAt: Date;
}): AgentActionLog {
  return {
    id: prismaModel.id as AgentActionLogId,
    organizationId: prismaModel.organizationId,
    agentRunId: prismaModel.agentRunId,
    collectionCaseId: prismaModel.collectionCaseId,
    type: prismaModel.type as AgentActionType,
    status: prismaModel.status as AgentActionStatus,
    summary: prismaModel.summary ?? undefined,
    payload: prismaModel.payload ?? undefined,
    error: prismaModel.error ?? undefined,
    createdAt: prismaModel.createdAt,
    updatedAt: prismaModel.updatedAt,
  };
}

export function createAgentRunRepository(): AgentRunRepository {
  return {
    async findById(context, id) {
      const result = await prisma.agentRun.findFirst({
        where: {
          id,
          organizationId: context.organizationId,
        },
      });
      return result ? mapPrismaAgentRunToDomain(result) : null;
    },

    async list(context, params) {
      const limit = params?.pagination?.limit ?? 50;
      const cursor = params?.pagination?.cursor;

      const where: any = {
        organizationId: context.organizationId,
      };

      if (params?.collectionCaseId) {
        where.collectionCaseId = params.collectionCaseId;
      }

      if (params?.status && params.status.length > 0) {
        where.status = { in: params.status };
      }

      const [data, totalCount] = await Promise.all([
        prisma.agentRun.findMany({
          where,
          take: limit + 1,
          cursor: cursor ? { id: cursor } : undefined,
          orderBy: { createdAt: "desc" },
        }),
        prisma.agentRun.count({ where }),
      ]);

      const hasNextPage = data.length > limit;
      const items = hasNextPage ? data.slice(0, limit) : data;
      const nextCursor = hasNextPage && items.length > 0 ? items[items.length - 1]!.id : null;

      return {
        data: items.map(mapPrismaAgentRunToDomain),
        nextCursor,
        totalCount,
      };
    },

    async create(context, payload) {
      const result = await prisma.agentRun.create({
        data: {
          organizationId: context.organizationId,
          collectionCaseId: payload.collectionCaseId,
          status: payload.status,
          startedAt: payload.startedAt,
          finishedAt: payload.finishedAt,
          error: payload.error,
          metadata: payload.metadata as any,
        },
      });
      return mapPrismaAgentRunToDomain(result);
    },

    async updateStatus(context, id, status, error) {
      const updateData: any = { status };
      if (status === "COMPLETED" || status === "FAILED" || status === "CANCELLED") {
        updateData.finishedAt = new Date();
      }
      if (error !== undefined) {
        updateData.error = error;
      }
      const result = await prisma.agentRun.update({
        where: {
          id,
          organizationId: context.organizationId,
        },
        data: updateData,
      });
      return mapPrismaAgentRunToDomain(result);
    },

    async appendActionLog(context, payload) {
      const result = await prisma.agentActionLog.create({
        data: {
          organizationId: context.organizationId,
          agentRunId: payload.agentRunId,
          collectionCaseId: payload.collectionCaseId,
          type: payload.type,
          status: payload.status,
          summary: payload.summary,
          payload: payload.payload as any,
          error: payload.error,
        },
      });
      return mapPrismaAgentActionLogToDomain(result);
    },

    async updateActionStatus(context, id, status, error) {
      const updateData: any = { status };
      if (error !== undefined) {
        updateData.error = error;
      }
      const result = await prisma.agentActionLog.update({
        where: {
          id,
          organizationId: context.organizationId,
        },
        data: updateData,
      });
      return mapPrismaAgentActionLogToDomain(result);
    },

    async listActions(context, agentRunId, filter) {
      const where: any = {
        agentRunId,
        organizationId: context.organizationId,
      };

      if (filter?.type && filter.type.length > 0) {
        where.type = { in: filter.type };
      }

      if (filter?.status && filter.status.length > 0) {
        where.status = { in: filter.status };
      }

      const results = await prisma.agentActionLog.findMany({
        where,
        orderBy: { createdAt: "asc" },
      });
      return results.map(mapPrismaAgentActionLogToDomain);
    },
  };
}
