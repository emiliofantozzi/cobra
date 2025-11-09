import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import type { RepositoryContext } from './types';

export interface SegmentRepository {
  findById(context: RepositoryContext, id: string): Promise<Prisma.SegmentGetPayload<{}> | null>;
  findByOrganization(context: RepositoryContext): Promise<Prisma.SegmentGetPayload<{}>[]>;
  create(context: RepositoryContext, data: Omit<Prisma.SegmentCreateInput, 'organization'>): Promise<Prisma.SegmentGetPayload<{}>>;
  update(context: RepositoryContext, id: string, data: Prisma.SegmentUpdateInput): Promise<Prisma.SegmentGetPayload<{}>>;
  delete(context: RepositoryContext, id: string): Promise<void>;
}

function ensureOrgFilter(where: any, organizationId: string) {
  return { ...where, organizationId };
}

export function createSegmentRepository(): SegmentRepository {
  return {
    async findById(context, id) {
      return prisma.segment.findFirst({
        where: {
          id,
          organizationId: context.organizationId,
        },
      });
    },

    async findByOrganization(context) {
      return prisma.segment.findMany({
        where: {
          organizationId: context.organizationId,
          isActive: true,
        },
        orderBy: { name: 'asc' },
      });
    },

    async create(context, data) {
      return prisma.segment.create({
        data: {
          ...data,
          organization: {
            connect: { id: context.organizationId },
          },
        },
      });
    },

    async update(context, id, data) {
      return prisma.segment.update({
        where: {
          id,
          organizationId: context.organizationId,
        },
        data,
      });
    },

    async delete(context, id) {
      await prisma.segment.delete({
        where: {
          id,
          organizationId: context.organizationId,
        },
      });
    },
  };
}

