import type {
  CommunicationAttempt,
  CommunicationAttemptId,
  CommunicationAttemptCreateData,
  CommunicationChannel,
  CommunicationDirection,
  CommunicationStatus,
  CollectionCaseId,
  ContactId,
} from "../domain";
import { prisma } from "../db";
import type { PaginatedResult, PaginationParams, RepositoryContext } from "./types";

export interface ListCommunicationAttemptsParams {
  collectionCaseId?: CollectionCaseId;
  contactId?: ContactId;
  channel?: CommunicationChannel[];
  direction?: CommunicationDirection[];
  status?: CommunicationStatus[];
  pagination?: PaginationParams;
}

export interface CommunicationAttemptRepository {
  findById(context: RepositoryContext, id: CommunicationAttemptId): Promise<CommunicationAttempt | null>;
  list(
    context: RepositoryContext,
    params?: ListCommunicationAttemptsParams,
  ): Promise<PaginatedResult<CommunicationAttempt>>;
  create(context: RepositoryContext, data: CommunicationAttemptCreateData): Promise<CommunicationAttempt>;
  updateStatus(
    context: RepositoryContext,
    id: CommunicationAttemptId,
    status: CommunicationStatus,
  ): Promise<CommunicationAttempt>;
  appendDeliveryMetadata(
    context: RepositoryContext,
    id: CommunicationAttemptId,
    metadata: Partial<Pick<CommunicationAttempt, "sentAt" | "deliveredAt" | "readAt" | "externalId" | "error">>,
  ): Promise<CommunicationAttempt>;
}

function mapPrismaToDomain(prismaModel: {
  id: string;
  organizationId: string;
  collectionCaseId: string;
  contactId: string | null;
  channel: string;
  direction: string;
  status: string;
  subject: string | null;
  body: string | null;
  payload: any;
  externalId: string | null;
  sentAt: Date | null;
  deliveredAt: Date | null;
  readAt: Date | null;
  error: string | null;
  createdAt: Date;
  updatedAt: Date;
}): CommunicationAttempt {
  return {
    id: prismaModel.id as CommunicationAttemptId,
    organizationId: prismaModel.organizationId,
    collectionCaseId: prismaModel.collectionCaseId,
    contactId: prismaModel.contactId ?? undefined,
    channel: prismaModel.channel as CommunicationChannel,
    direction: prismaModel.direction as CommunicationDirection,
    status: prismaModel.status as CommunicationStatus,
    subject: prismaModel.subject ?? undefined,
    body: prismaModel.body ?? undefined,
    payload: prismaModel.payload ?? undefined,
    externalId: prismaModel.externalId ?? undefined,
    sentAt: prismaModel.sentAt ?? undefined,
    deliveredAt: prismaModel.deliveredAt ?? undefined,
    readAt: prismaModel.readAt ?? undefined,
    error: prismaModel.error ?? undefined,
    createdAt: prismaModel.createdAt,
    updatedAt: prismaModel.updatedAt,
  };
}

export function createCommunicationAttemptRepository(): CommunicationAttemptRepository {
  return {
    async findById(context, id) {
      const result = await prisma.communicationAttempt.findFirst({
        where: {
          id,
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

      if (params?.collectionCaseId) {
        where.collectionCaseId = params.collectionCaseId;
      }

      if (params?.contactId) {
        where.contactId = params.contactId;
      }

      if (params?.channel && params.channel.length > 0) {
        where.channel = { in: params.channel };
      }

      if (params?.direction && params.direction.length > 0) {
        where.direction = { in: params.direction };
      }

      if (params?.status && params.status.length > 0) {
        where.status = { in: params.status };
      }

      const [data, totalCount] = await Promise.all([
        prisma.communicationAttempt.findMany({
          where,
          take: limit + 1,
          cursor: cursor ? { id: cursor } : undefined,
          orderBy: { createdAt: "desc" },
        }),
        prisma.communicationAttempt.count({ where }),
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
      const result = await prisma.communicationAttempt.create({
        data: {
          organizationId: context.organizationId,
          collectionCaseId: data.collectionCaseId,
          contactId: data.contactId,
          channel: data.channel,
          direction: data.direction,
          status: data.status,
          subject: data.subject,
          body: data.body,
          payload: data.payload as any,
        },
      });
      return mapPrismaToDomain(result);
    },

    async updateStatus(context, id, status) {
      const result = await prisma.communicationAttempt.update({
        where: {
          id,
          organizationId: context.organizationId,
        },
        data: { status },
      });
      return mapPrismaToDomain(result);
    },

    async appendDeliveryMetadata(context, id, metadata) {
      const updateData: any = {};
      if (metadata.sentAt !== undefined) updateData.sentAt = metadata.sentAt;
      if (metadata.deliveredAt !== undefined) updateData.deliveredAt = metadata.deliveredAt;
      if (metadata.readAt !== undefined) updateData.readAt = metadata.readAt;
      if (metadata.externalId !== undefined) updateData.externalId = metadata.externalId;
      if (metadata.error !== undefined) updateData.error = metadata.error;

      const result = await prisma.communicationAttempt.update({
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
