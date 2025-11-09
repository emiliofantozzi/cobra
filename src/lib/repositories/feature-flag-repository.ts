import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import type { RepositoryContext } from './types';

export interface FeatureFlagRepository {
  findByKey(context: RepositoryContext, flagKey: string): Promise<Prisma.FeatureFlagGetPayload<{}> | null>;
  findByOrganization(context: RepositoryContext): Promise<Prisma.FeatureFlagGetPayload<{}>[]>;
  isEnabled(context: RepositoryContext, flagKey: string): Promise<boolean>;
  setFlag(context: RepositoryContext, flagKey: string, enabled: boolean, metadata?: Prisma.InputJsonValue): Promise<Prisma.FeatureFlagGetPayload<{}>>;
  delete(context: RepositoryContext, flagKey: string): Promise<void>;
}

export function createFeatureFlagRepository(): FeatureFlagRepository {
  return {
    async findByKey(context, flagKey) {
      return prisma.featureFlag.findUnique({
        where: {
          organizationId_flagKey: {
            organizationId: context.organizationId,
            flagKey,
          },
        },
      });
    },

    async findByOrganization(context) {
      return prisma.featureFlag.findMany({
        where: {
          organizationId: context.organizationId,
        },
        orderBy: { flagKey: 'asc' },
      });
    },

    async isEnabled(context, flagKey) {
      const flag = await prisma.featureFlag.findUnique({
        where: {
          organizationId_flagKey: {
            organizationId: context.organizationId,
            flagKey,
          },
        },
        select: { enabled: true },
      });
      return flag?.enabled ?? false;
    },

    async setFlag(context, flagKey, enabled, metadata) {
      return prisma.featureFlag.upsert({
        where: {
          organizationId_flagKey: {
            organizationId: context.organizationId,
            flagKey,
          },
        },
        update: {
          enabled,
          metadata,
        },
        create: {
          organizationId: context.organizationId,
          flagKey,
          enabled,
          metadata,
        },
      });
    },

    async delete(context, flagKey) {
      await prisma.featureFlag.delete({
        where: {
          organizationId_flagKey: {
            organizationId: context.organizationId,
            flagKey,
          },
        },
      });
    },
  };
}

