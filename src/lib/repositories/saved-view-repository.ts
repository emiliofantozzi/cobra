import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import type { RepositoryContext } from './types';

export interface SavedViewRepository {
  findById(context: RepositoryContext, id: string): Promise<Prisma.SavedViewGetPayload<{}> | null>;
  findByOrganization(context: RepositoryContext, viewType?: string, userId?: string): Promise<Prisma.SavedViewGetPayload<{}>[]>;
  create(context: RepositoryContext, data: Omit<Prisma.SavedViewCreateInput, 'organization'>): Promise<Prisma.SavedViewGetPayload<{}>>;
  update(context: RepositoryContext, id: string, data: Prisma.SavedViewUpdateInput): Promise<Prisma.SavedViewGetPayload<{}>>;
  delete(context: RepositoryContext, id: string): Promise<void>;
}

export function createSavedViewRepository(): SavedViewRepository {
  return {
    async findById(context, id) {
      return prisma.savedView.findFirst({
        where: {
          id,
          organizationId: context.organizationId,
        },
      });
    },

    async findByOrganization(context, viewType, userId) {
      const where: Prisma.SavedViewWhereInput = {
        organizationId: context.organizationId,
        OR: [
          { userId: userId ?? null },
          { isShared: true },
        ],
      };

      if (viewType) {
        where.viewType = viewType;
      }

      return prisma.savedView.findMany({
        where,
        orderBy: { name: 'asc' },
      });
    },

    async create(context, data) {
      return prisma.savedView.create({
        data: {
          ...data,
          organization: {
            connect: { id: context.organizationId },
          },
        },
      });
    },

    async update(context, id, data) {
      return prisma.savedView.update({
        where: {
          id,
          organizationId: context.organizationId,
        },
        data,
      });
    },

    async delete(context, id) {
      await prisma.savedView.delete({
        where: {
          id,
          organizationId: context.organizationId,
        },
      });
    },
  };
}

