import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import type { RepositoryContext } from './types';

export interface PlaybookRepository {
  findByKey(context: RepositoryContext, key: string): Promise<Prisma.PlaybookGetPayload<{}> | null>;
  findByOrganization(context: RepositoryContext, activeOnly?: boolean): Promise<Prisma.PlaybookGetPayload<{}>[]>;
  create(context: RepositoryContext, data: Omit<Prisma.PlaybookCreateInput, 'organization'>): Promise<Prisma.PlaybookGetPayload<{}>>;
  update(context: RepositoryContext, key: string, data: Prisma.PlaybookUpdateInput): Promise<Prisma.PlaybookGetPayload<{}>>;
  activate(context: RepositoryContext, key: string): Promise<Prisma.PlaybookGetPayload<{}>>;
  deactivate(context: RepositoryContext, key: string): Promise<Prisma.PlaybookGetPayload<{}>>;
  delete(context: RepositoryContext, key: string): Promise<void>;
}

export function createPlaybookRepository(): PlaybookRepository {
  return {
    async findByKey(context, key) {
      return prisma.playbook.findUnique({
        where: {
          organizationId_key: {
            organizationId: context.organizationId,
            key,
          },
        },
      });
    },

    async findByOrganization(context, activeOnly = false) {
      const where: Prisma.PlaybookWhereInput = {
        organizationId: context.organizationId,
      };

      if (activeOnly) {
        where.isActive = true;
      }

      return prisma.playbook.findMany({
        where,
        orderBy: { name: 'asc' },
      });
    },

    async create(context, data) {
      return prisma.playbook.create({
        data: {
          ...data,
          organization: {
            connect: { id: context.organizationId },
          },
        },
      });
    },

    async update(context, key, data) {
      return prisma.playbook.update({
        where: {
          organizationId_key: {
            organizationId: context.organizationId,
            key,
          },
        },
        data,
      });
    },

    async activate(context, key) {
      return prisma.playbook.update({
        where: {
          organizationId_key: {
            organizationId: context.organizationId,
            key,
          },
        },
        data: { isActive: true },
      });
    },

    async deactivate(context, key) {
      return prisma.playbook.update({
        where: {
          organizationId_key: {
            organizationId: context.organizationId,
            key,
          },
        },
        data: { isActive: false },
      });
    },

    async delete(context, key) {
      await prisma.playbook.delete({
        where: {
          organizationId_key: {
            organizationId: context.organizationId,
            key,
          },
        },
      });
    },
  };
}

