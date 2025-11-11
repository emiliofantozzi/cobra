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
  sortBy?: "name" | "createdAt";
  sortDirection?: "asc" | "desc";
}

export interface CustomerCompanyRepository {
  findById(context: RepositoryContext, id: CustomerCompanyId): Promise<CustomerCompany | null>;
  findByTaxId(context: RepositoryContext, taxId: string): Promise<CustomerCompany | null>;
  list(
    context: RepositoryContext,
    params?: ListCustomerCompaniesParams,
  ): Promise<PaginatedResult<CustomerCompany & { contactsCount: number; invoicesCount: number }>>;
  searchByName(context: RepositoryContext, search: string, limit?: number): Promise<CustomerCompany[]>;
  countByStatus(context: RepositoryContext, status?: CustomerCompanyStatus[]): Promise<number>;
  findWithRelations(
    context: RepositoryContext,
    id: CustomerCompanyId,
  ): Promise<(CustomerCompany & { contactsCount: number; invoicesCount: number; totalPendingAmount: number }) | null>;
  create(context: RepositoryContext, data: CustomerCompanyCreateData): Promise<CustomerCompany>;
  update(
    context: RepositoryContext,
    id: CustomerCompanyId,
    patch: Partial<Omit<CustomerCompanyDraft, "organizationId">>,
  ): Promise<CustomerCompany>;
  archive(context: RepositoryContext, id: CustomerCompanyId): Promise<CustomerCompany>;
  reactivate(context: RepositoryContext, id: CustomerCompanyId): Promise<CustomerCompany>;
  bulkArchive(context: RepositoryContext, ids: CustomerCompanyId[]): Promise<number>;
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

    async findByTaxId(context, taxId) {
      if (!taxId) return null;
      const result = await prisma.customerCompany.findFirst({
        where: {
          taxId,
          organizationId: context.organizationId,
        },
      });
      return result ? mapPrismaToDomain(result) : null;
    },

    async searchByName(context, search, limit = 100) {
      const results = await prisma.customerCompany.findMany({
        where: {
          organizationId: context.organizationId,
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { legalName: { contains: search, mode: "insensitive" } },
            { taxId: { contains: search, mode: "insensitive" } },
          ],
        },
        take: limit,
        orderBy: { name: "asc" },
      });
      return results.map(mapPrismaToDomain);
    },

    async countByStatus(context, status) {
      const where: any = {
        organizationId: context.organizationId,
      };
      if (status && status.length > 0) {
        where.status = { in: status };
      }
      return prisma.customerCompany.count({ where });
    },

    async findWithRelations(context, id) {
      const result = await prisma.customerCompany.findFirst({
        where: {
          id,
          organizationId: context.organizationId,
        },
        include: {
          _count: {
            select: {
              contacts: true,
              invoices: true,
            },
          },
          invoices: {
            where: {
              status: {
                in: ["PENDING", "OVERDUE", "PARTIALLY_PAID"],
              },
            },
            select: {
              amount: true,
            },
          },
        },
      });

      if (!result) return null;

      const totalPendingAmount = result.invoices.reduce((sum, inv) => {
        return sum + Number(inv.amount);
      }, 0);

      return {
        ...mapPrismaToDomain(result),
        contactsCount: result._count.contacts,
        invoicesCount: result._count.invoices,
        totalPendingAmount,
      };
    },

    async list(context, params) {
      const limit = params?.pagination?.limit ?? 50;
      const cursor = params?.pagination?.cursor;
      const sortBy = params?.sortBy ?? "createdAt";
      const sortDirection = params?.sortDirection ?? "desc";

      const where: any = {
        organizationId: context.organizationId,
      };

      if (params?.status && params.status.length > 0) {
        where.status = { in: params.status };
      }

      if (params?.search && params.search.trim().length > 0) {
        where.OR = [
          { name: { contains: params.search.trim(), mode: "insensitive" } },
          { legalName: { contains: params.search.trim(), mode: "insensitive" } },
          { taxId: { contains: params.search.trim(), mode: "insensitive" } },
        ];
      }

      const orderBy: any = {};
      orderBy[sortBy] = sortDirection;

      const [data, totalCount] = await Promise.all([
        prisma.customerCompany.findMany({
          where,
          take: limit + 1,
          cursor: cursor ? { id: cursor } : undefined,
          orderBy,
          include: {
            _count: {
              select: {
                contacts: true,
                invoices: true,
              },
            },
          },
        }),
        prisma.customerCompany.count({ where }),
      ]);

      const hasNextPage = data.length > limit;
      const items = hasNextPage ? data.slice(0, limit) : data;
      const nextCursor = hasNextPage && items.length > 0 ? items[items.length - 1]!.id : null;

      return {
        data: items.map((item) => ({
          ...mapPrismaToDomain(item),
          contactsCount: item._count.contacts,
          invoicesCount: item._count.invoices,
        })),
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

    async reactivate(context, id) {
      const result = await prisma.customerCompany.update({
        where: {
          id,
          organizationId: context.organizationId,
        },
        data: {
          status: "ACTIVE",
          archivedAt: null,
        },
      });
      return mapPrismaToDomain(result);
    },

    async bulkArchive(context, ids) {
      const result = await prisma.customerCompany.updateMany({
        where: {
          id: { in: ids },
          organizationId: context.organizationId,
        },
        data: {
          status: "ARCHIVED",
          archivedAt: new Date(),
        },
      });
      return result.count;
    },
  };
}

