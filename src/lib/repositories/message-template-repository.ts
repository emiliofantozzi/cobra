import { prisma } from '@/lib/db';
import type { Prisma, CommunicationChannel } from '@prisma/client';
import type { RepositoryContext } from './types';

export interface MessageTemplateRepository {
  findByKey(context: RepositoryContext, key: string): Promise<Prisma.MessageTemplateGetPayload<{}> | null>;
  findByOrganization(context: RepositoryContext, channel?: CommunicationChannel): Promise<Prisma.MessageTemplateGetPayload<{}>[]>;
  create(context: RepositoryContext, data: Omit<Prisma.MessageTemplateCreateInput, 'organization'>): Promise<Prisma.MessageTemplateGetPayload<{}>>;
  update(context: RepositoryContext, key: string, data: Prisma.MessageTemplateUpdateInput): Promise<Prisma.MessageTemplateGetPayload<{}>>;
  delete(context: RepositoryContext, key: string): Promise<void>;
}

export function createMessageTemplateRepository(): MessageTemplateRepository {
  return {
    async findByKey(context, key) {
      return prisma.messageTemplate.findUnique({
        where: {
          organizationId_key: {
            organizationId: context.organizationId,
            key,
          },
        },
      });
    },

    async findByOrganization(context, channel) {
      const where: Prisma.MessageTemplateWhereInput = {
        organizationId: context.organizationId,
        isActive: true,
      };

      if (channel) {
        where.channel = channel;
      }

      return prisma.messageTemplate.findMany({
        where,
        orderBy: { name: 'asc' },
      });
    },

    async create(context, data) {
      return prisma.messageTemplate.create({
        data: {
          ...data,
          organization: {
            connect: { id: context.organizationId },
          },
        },
      });
    },

    async update(context, key, data) {
      return prisma.messageTemplate.update({
        where: {
          organizationId_key: {
            organizationId: context.organizationId,
            key,
          },
        },
        data,
      });
    },

    async delete(context, key) {
      await prisma.messageTemplate.delete({
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

