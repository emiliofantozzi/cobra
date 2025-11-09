import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import type { RepositoryContext, PaginatedResult, PaginationParams } from './types';

export interface ListAuditLogsParams {
  entityType?: string;
  entityId?: string;
  action?: string;
  actorId?: string;
  startDate?: Date;
  endDate?: Date;
  pagination?: PaginationParams;
}

export interface AuditLogRepository {
  create(context: RepositoryContext, data: Omit<Prisma.AuditLogCreateInput, 'organization'>): Promise<Prisma.AuditLogGetPayload<{}>>;
  list(context: RepositoryContext, params?: ListAuditLogsParams): Promise<PaginatedResult<Prisma.AuditLogGetPayload<{}>>>;
  findByEntity(context: RepositoryContext, entityType: string, entityId: string): Promise<Prisma.AuditLogGetPayload<{}>[]>;
}

export function createAuditLogRepository(): AuditLogRepository {
  return {
    async create(context, data) {
      return prisma.auditLog.create({
        data: {
          ...data,
          organization: {
            connect: { id: context.organizationId },
          },
        },
      });
    },

    async list(context, params) {
      const limit = params?.pagination?.limit ?? 50;
      const cursor = params?.pagination?.cursor;

      const where: Prisma.AuditLogWhereInput = {
        organizationId: context.organizationId,
      };

      if (params?.entityType) {
        where.entityType = params.entityType;
      }

      if (params?.entityId) {
        where.entityId = params.entityId;
      }

      if (params?.action) {
        where.action = params.action;
      }

      if (params?.actorId) {
        where.actorId = params.actorId;
      }

      if (params?.startDate || params?.endDate) {
        where.createdAt = {};
        if (params.startDate) {
          where.createdAt.gte = params.startDate;
        }
        if (params.endDate) {
          where.createdAt.lte = params.endDate;
        }
      }

      const [data, totalCount] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          take: limit + 1,
          cursor: cursor ? { id: cursor } : undefined,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.auditLog.count({ where }),
      ]);

      const hasNextPage = data.length > limit;
      const items = hasNextPage ? data.slice(0, limit) : data;
      const nextCursor = hasNextPage && items.length > 0 ? items[items.length - 1]!.id : null;

      return {
        data: items,
        nextCursor,
        totalCount,
      };
    },

    async findByEntity(context, entityType, entityId) {
      return prisma.auditLog.findMany({
        where: {
          organizationId: context.organizationId,
          entityType,
          entityId,
        },
        orderBy: { createdAt: 'desc' },
      });
    },
  };
}

