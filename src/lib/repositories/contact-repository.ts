import type { Contact, ContactDraft, ContactId, ContactCreateData, CustomerCompanyId } from "../domain";
import { prisma } from "../db";
import type { PaginationParams, PaginatedResult, RepositoryContext } from "./types";

export interface ListContactsParams {
  customerCompanyId?: CustomerCompanyId;
  search?: string;
  pagination?: PaginationParams;
}

export interface ContactRepository {
  findById(context: RepositoryContext, id: ContactId): Promise<Contact | null>;
  list(context: RepositoryContext, params?: ListContactsParams): Promise<PaginatedResult<Contact>>;
  create(context: RepositoryContext, data: ContactCreateData): Promise<Contact>;
  update(
    context: RepositoryContext,
    id: ContactId,
    patch: Partial<Omit<ContactDraft, "organizationId" | "customerCompanyId">>,
  ): Promise<Contact>;
  delete(context: RepositoryContext, id: ContactId): Promise<void>;
}

function mapPrismaToDomain(prismaModel: {
  id: string;
  organizationId: string;
  customerCompanyId: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phoneNumber: string | null;
  whatsappNumber: string | null;
  position: string | null;
  notes: string | null;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
}): Contact {
  return {
    id: prismaModel.id as ContactId,
    organizationId: prismaModel.organizationId,
    customerCompanyId: prismaModel.customerCompanyId,
    firstName: prismaModel.firstName ?? undefined,
    lastName: prismaModel.lastName ?? undefined,
    email: prismaModel.email ?? undefined,
    phoneNumber: prismaModel.phoneNumber ?? undefined,
    whatsappNumber: prismaModel.whatsappNumber ?? undefined,
    position: prismaModel.position ?? undefined,
    notes: prismaModel.notes ?? undefined,
    isPrimary: prismaModel.isPrimary,
    createdAt: prismaModel.createdAt,
    updatedAt: prismaModel.updatedAt,
  };
}

export function createContactRepository(): ContactRepository {
  return {
    async findById(context, id) {
      const result = await prisma.contact.findFirst({
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

      if (params?.customerCompanyId) {
        where.customerCompanyId = params.customerCompanyId;
      }

      if (params?.search) {
        where.OR = [
          { firstName: { contains: params.search, mode: "insensitive" } },
          { lastName: { contains: params.search, mode: "insensitive" } },
          { email: { contains: params.search, mode: "insensitive" } },
          { phoneNumber: { contains: params.search, mode: "insensitive" } },
        ];
      }

      const [data, totalCount] = await Promise.all([
        prisma.contact.findMany({
          where,
          take: limit + 1,
          cursor: cursor ? { id: cursor } : undefined,
          orderBy: { createdAt: "desc" },
        }),
        prisma.contact.count({ where }),
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
      const result = await prisma.contact.create({
        data: {
          organizationId: context.organizationId,
          customerCompanyId: data.customerCompanyId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phoneNumber: data.phoneNumber,
          whatsappNumber: data.whatsappNumber,
          position: data.position,
          notes: data.notes,
          isPrimary: data.isPrimary,
        },
      });
      return mapPrismaToDomain(result);
    },

    async update(context, id, patch) {
      const updateData: any = {};
      if (patch.firstName !== undefined) updateData.firstName = patch.firstName;
      if (patch.lastName !== undefined) updateData.lastName = patch.lastName;
      if (patch.email !== undefined) updateData.email = patch.email;
      if (patch.phoneNumber !== undefined) updateData.phoneNumber = patch.phoneNumber;
      if (patch.whatsappNumber !== undefined) updateData.whatsappNumber = patch.whatsappNumber;
      if (patch.position !== undefined) updateData.position = patch.position;
      if (patch.notes !== undefined) updateData.notes = patch.notes;
      if (patch.isPrimary !== undefined) updateData.isPrimary = patch.isPrimary;

      const result = await prisma.contact.update({
        where: {
          id,
          organizationId: context.organizationId,
        },
        data: updateData,
      });
      return mapPrismaToDomain(result);
    },

    async delete(context, id) {
      await prisma.contact.delete({
        where: {
          id,
          organizationId: context.organizationId,
        },
      });
    },
  };
}

