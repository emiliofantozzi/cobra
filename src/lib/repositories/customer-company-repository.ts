import type {
  CustomerCompany,
  CustomerCompanyDraft,
  CustomerCompanyId,
  CustomerCompanyStatus,
  CustomerCompanyCreateData,
} from "../domain";
import { prisma } from "../db";
import type { PaginationParams, PaginatedResult, RepositoryContext } from "./types";

export interface ListCustomerCompaniesParams {
  status?: CustomerCompanyStatus[];
  search?: string;
  pagination?: PaginationParams;
}

export interface CustomerCompanyRepository {
  findById(context: RepositoryContext, id: CustomerCompanyId): Promise<CustomerCompany | null>;
  list(context: RepositoryContext, params?: ListCustomerCompaniesParams): Promise<PaginatedResult<CustomerCompany>>;
  create(context: RepositoryContext, data: CustomerCompanyCreateData): Promise<CustomerCompany>;
  update(
    context: RepositoryContext,
    id: CustomerCompanyId,
    patch: Partial<Omit<CustomerCompanyDraft, "organizationId">>,
  ): Promise<CustomerCompany>;
  archive(context: RepositoryContext, id: CustomerCompanyId): Promise<CustomerCompany>;
}

function mapPrismaToDomain(prismaModel: {
  id: string;
  organizationId: string;
  name: string;
  legalName: string | null;
  taxId: string | null;
  status: string;
  industry: string | null;
  website: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
}): CustomerCompany {
  return {
    id: prismaModel.id as CustomerCompanyId,
    organizationId: prismaModel.organizationId,
    name: prismaModel.name,
    legalName: prismaModel.legalName ?? undefined,
    taxId: prismaModel.taxId ?? undefined,
    status: prismaModel.status as CustomerCompanyStatus,
    industry: prismaModel.industry ?? undefined,
    website: prismaModel.website ?? undefined,
    notes: prismaModel.notes ?? undefined,
    createdAt: prismaModel.createdAt,
    updatedAt: prismaModel.updatedAt,
    archivedAt: prismaModel.archivedAt ?? undefined,
  };
}

export function createCustomerCompanyRepository(): CustomerCompanyRepository {
  return {
    async findById(context, id) {
      const result = await prisma.customerCompany.findFirst({
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

      if (params?.status && params.status.length > 0) {
        where.status = { in: params.status };
      }

      if (params?.search) {
        where.OR = [
          { name: { contains: params.search, mode: "insensitive" } },
          { legalName: { contains: params.search, mode: "insensitive" } },
          { taxId: { contains: params.search, mode: "insensitive" } },
        ];
      }

      const [data, totalCount] = await Promise.all([
        prisma.customerCompany.findMany({
          where,
          take: limit + 1,
          cursor: cursor ? { id: cursor } : undefined,
          orderBy: { createdAt: "desc" },
        }),
        prisma.customerCompany.count({ where }),
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
      const result = await prisma.customerCompany.create({
        data: {
          organizationId: context.organizationId,
          name: data.name,
          legalName: data.legalName,
          taxId: data.taxId,
          status: data.status,
          industry: data.industry,
          website: data.website,
          notes: data.notes,
          archivedAt: data.archivedAt,
        },
      });
      return mapPrismaToDomain(result);
    },

    async update(context, id, patch) {
      const updateData: any = {};
      if (patch.name !== undefined) updateData.name = patch.name;
      if (patch.legalName !== undefined) updateData.legalName = patch.legalName;
      if (patch.taxId !== undefined) updateData.taxId = patch.taxId;
      if (patch.status !== undefined) {
        updateData.status = patch.status;
        if (patch.status === "ARCHIVED") {
          updateData.archivedAt = new Date();
        } else {
          updateData.archivedAt = null;
        }
      }
      if (patch.industry !== undefined) updateData.industry = patch.industry;
      if (patch.website !== undefined) updateData.website = patch.website;
      if (patch.notes !== undefined) updateData.notes = patch.notes;

      const result = await prisma.customerCompany.update({
        where: {
          id,
          organizationId: context.organizationId,
        },
        data: updateData,
      });
      return mapPrismaToDomain(result);
    },

    async archive(context, id) {
      const result = await prisma.customerCompany.update({
        where: {
          id,
          organizationId: context.organizationId,
        },
        data: {
          status: "ARCHIVED",
          archivedAt: new Date(),
        },
      });
      return mapPrismaToDomain(result);
    },
  };
}

