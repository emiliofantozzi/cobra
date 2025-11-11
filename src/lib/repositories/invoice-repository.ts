import type {
  Invoice,
  InvoiceDraft,
  InvoiceId,
  InvoiceStatus,
  InvoiceCreateData,
  CustomerCompanyId,
} from "../domain";
import type { InvoiceWithCompany } from "../types/invoice-extended";
import { prisma } from "../db";
import type { PaginatedResult, PaginationParams, RepositoryContext } from "./types";

export interface ListInvoicesParams {
  customerCompanyId?: CustomerCompanyId;
  status?: InvoiceStatus[];
  search?: string;
  expectedPaymentDateFrom?: Date;
  expectedPaymentDateTo?: Date;
  nextActionAtFrom?: Date;
  nextActionAtTo?: Date;
  dateOrigin?: string;
  pagination?: PaginationParams;
}

export interface InvoiceRepository {
  findById(context: RepositoryContext, id: InvoiceId): Promise<Invoice | null>;
  list(context: RepositoryContext, params?: ListInvoicesParams): Promise<PaginatedResult<InvoiceWithCompany>>;
  create(context: RepositoryContext, data: InvoiceCreateData): Promise<Invoice>;
  update(
    context: RepositoryContext,
    id: InvoiceId,
    patch: Partial<Omit<InvoiceDraft, "organizationId" | "customerCompanyId">>,
  ): Promise<Invoice>;
  setStatus(context: RepositoryContext, id: InvoiceId, status: InvoiceStatus): Promise<Invoice>;
  findByExpectedPaymentDate(context: RepositoryContext, from: Date, to: Date): Promise<Invoice[]>;
  findByNextAction(context: RepositoryContext, from: Date, to: Date): Promise<Invoice[]>;
  updateExpectedPaymentDate(
    context: RepositoryContext,
    id: InvoiceId,
    expectedPaymentDate: Date | null,
    dateOrigin: string | null,
    changedBy?: string
  ): Promise<Invoice>;
  findByNumber(context: RepositoryContext, number: string): Promise<Invoice | null>;
  findWithoutExpectedDate(context: RepositoryContext): Promise<Invoice[]>;
  findDueDateToday(context: RepositoryContext, today: Date): Promise<Invoice[]>;
  findOverdue(context: RepositoryContext, today: Date): Promise<Invoice[]>;
  findWithPromiseToday(context: RepositoryContext, today: Date): Promise<Invoice[]>;
  findWithPromiseMissed(context: RepositoryContext, today: Date): Promise<Invoice[]>;
  searchByNumberOrCompany(context: RepositoryContext, query: string, limit?: number): Promise<Invoice[]>;
  countByFilters(context: RepositoryContext, filters: Partial<ListInvoicesParams>): Promise<number>;
  findWithRelations(context: RepositoryContext, id: InvoiceId): Promise<Invoice | null>;
}

function mapPrismaToDomain(prismaModel: {
  id: string;
  organizationId: string;
  customerCompanyId: string;
  number: string | null;
  description: string | null;
  issueDate: Date;
  dueDate: Date;
  amount: any; // Decimal
  currency: string;
  status: string;
  notes: string | null;
  metadata: any;
  expectedPaymentDate: Date | null;
  dateOrigin: string | null;
  paymentPromiseDate: Date | null;
  nextActionAt: Date | null;
  lastChannel: string | null;
  lastResult: string | null;
  createdAt: Date;
  updatedAt: Date;
}): Invoice {
  return {
    id: prismaModel.id as InvoiceId,
    organizationId: prismaModel.organizationId,
    customerCompanyId: prismaModel.customerCompanyId,
    number: prismaModel.number ?? undefined,
    description: prismaModel.description ?? undefined,
    issueDate: prismaModel.issueDate,
    dueDate: prismaModel.dueDate,
    amount: Number(prismaModel.amount),
    currency: prismaModel.currency,
    status: prismaModel.status as InvoiceStatus,
    notes: prismaModel.notes ?? undefined,
    metadata: prismaModel.metadata ?? undefined,
    expectedPaymentDate: prismaModel.expectedPaymentDate ?? undefined,
    dateOrigin: (prismaModel.dateOrigin as any) ?? undefined,
    paymentPromiseDate: prismaModel.paymentPromiseDate ?? undefined,
    nextActionAt: prismaModel.nextActionAt ?? undefined,
    lastChannel: (prismaModel.lastChannel as any) ?? undefined,
    lastResult: prismaModel.lastResult ?? undefined,
    createdAt: prismaModel.createdAt,
    updatedAt: prismaModel.updatedAt,
  };
}

export function createInvoiceRepository(): InvoiceRepository {
  return {
    async findById(context, id) {
      const result = await prisma.invoice.findFirst({
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

      if (params?.status && params.status.length > 0) {
        where.status = { in: params.status };
      }

      if (params?.expectedPaymentDateFrom || params?.expectedPaymentDateTo) {
        where.expectedPaymentDate = {};
        if (params.expectedPaymentDateFrom) {
          where.expectedPaymentDate.gte = params.expectedPaymentDateFrom;
        }
        if (params.expectedPaymentDateTo) {
          where.expectedPaymentDate.lte = params.expectedPaymentDateTo;
        }
      }

      if (params?.nextActionAtFrom || params?.nextActionAtTo) {
        where.nextActionAt = {};
        if (params.nextActionAtFrom) {
          where.nextActionAt.gte = params.nextActionAtFrom;
        }
        if (params.nextActionAtTo) {
          where.nextActionAt.lte = params.nextActionAtTo;
        }
      }

      if (params?.dateOrigin) {
        where.dateOrigin = params.dateOrigin;
      }

      if (params?.search) {
        where.OR = [
          { number: { contains: params.search, mode: "insensitive" } },
          { description: { contains: params.search, mode: "insensitive" } },
          {
            customerCompany: {
              name: { contains: params.search, mode: "insensitive" },
            },
          },
        ];
      }

      const [data, totalCount] = await Promise.all([
        prisma.invoice.findMany({
          where,
          take: limit + 1,
          cursor: cursor ? { id: cursor } : undefined,
          orderBy: { dueDate: "asc" },
          include: {
            customerCompany: {
              select: {
                id: true,
                name: true,
                legalName: true,
              },
            },
          },
        }),
        prisma.invoice.count({ where }),
      ]);

      const hasNextPage = data.length > limit;
      const items = hasNextPage ? data.slice(0, limit) : data;
      const nextCursor = hasNextPage && items.length > 0 ? items[items.length - 1]!.id : null;

      return {
        data: items.map((item) => ({
          ...mapPrismaToDomain(item),
          customerCompany: item.customerCompany ? {
            id: item.customerCompany.id,
            name: item.customerCompany.name,
            legalName: item.customerCompany.legalName ?? undefined,
          } : undefined,
        })),
        nextCursor,
        totalCount,
      };
    },

    async create(context, data) {
      const result = await prisma.invoice.create({
        data: {
          organizationId: context.organizationId,
          customerCompanyId: data.customerCompanyId,
          number: data.number,
          description: data.description,
          issueDate: data.issueDate,
          dueDate: data.dueDate,
          amount: data.amount,
          currency: data.currency,
          status: data.status,
          notes: data.notes,
          metadata: data.metadata as any,
          expectedPaymentDate: data.expectedPaymentDate,
          dateOrigin: data.dateOrigin as any,
          paymentPromiseDate: data.paymentPromiseDate,
          nextActionAt: data.nextActionAt,
          lastChannel: data.lastChannel as any,
          lastResult: data.lastResult,
        },
      });
      return mapPrismaToDomain(result);
    },

    async update(context, id, patch) {
      const updateData: any = {};
      if (patch.number !== undefined) updateData.number = patch.number;
      if (patch.description !== undefined) updateData.description = patch.description;
      if (patch.issueDate !== undefined) updateData.issueDate = patch.issueDate;
      if (patch.dueDate !== undefined) updateData.dueDate = patch.dueDate;
      if (patch.amount !== undefined) updateData.amount = patch.amount;
      if (patch.currency !== undefined) updateData.currency = patch.currency;
      if (patch.notes !== undefined) updateData.notes = patch.notes;
      if (patch.metadata !== undefined) updateData.metadata = patch.metadata as any;
      if (patch.expectedPaymentDate !== undefined) updateData.expectedPaymentDate = patch.expectedPaymentDate;
      if (patch.dateOrigin !== undefined) updateData.dateOrigin = patch.dateOrigin as any;
      if (patch.paymentPromiseDate !== undefined) updateData.paymentPromiseDate = patch.paymentPromiseDate;
      if (patch.nextActionAt !== undefined) updateData.nextActionAt = patch.nextActionAt;
      if (patch.lastChannel !== undefined) updateData.lastChannel = patch.lastChannel as any;
      if (patch.lastResult !== undefined) updateData.lastResult = patch.lastResult;

      const result = await prisma.invoice.update({
        where: {
          id,
          organizationId: context.organizationId,
        },
        data: updateData,
      });
      return mapPrismaToDomain(result);
    },

    async setStatus(context, id, status) {
      const result = await prisma.invoice.update({
        where: {
          id,
          organizationId: context.organizationId,
        },
        data: { status },
      });
      return mapPrismaToDomain(result);
    },

    async findByExpectedPaymentDate(context, from, to) {
      const results = await prisma.invoice.findMany({
        where: {
          organizationId: context.organizationId,
          expectedPaymentDate: {
            gte: from,
            lte: to,
          },
        },
        orderBy: { expectedPaymentDate: 'asc' },
      });
      return results.map(mapPrismaToDomain);
    },

    async findByNextAction(context, from, to) {
      const results = await prisma.invoice.findMany({
        where: {
          organizationId: context.organizationId,
          nextActionAt: {
            gte: from,
            lte: to,
          },
        },
        orderBy: { nextActionAt: 'asc' },
      });
      return results.map(mapPrismaToDomain);
    },

    async updateExpectedPaymentDate(context, id, expectedPaymentDate, dateOrigin, changedBy) {
      // Get current invoice to track date change
      const currentInvoice = await prisma.invoice.findFirst({
        where: {
          id,
          organizationId: context.organizationId,
        },
        select: { expectedPaymentDate: true },
      });

      // Update invoice
      const result = await prisma.invoice.update({
        where: {
          id,
          organizationId: context.organizationId,
        },
        data: {
          expectedPaymentDate,
          dateOrigin: dateOrigin as any,
        },
      });

      // Record date change history if date changed
      if (currentInvoice && currentInvoice.expectedPaymentDate !== expectedPaymentDate) {
        await prisma.invoiceDateHistory.create({
          data: {
            invoiceId: id,
            previousDate: currentInvoice.expectedPaymentDate,
            newDate: expectedPaymentDate,
            changedBy: changedBy ?? null,
            reason: `Updated via ${dateOrigin ?? 'manual'}`,
          },
        });
      }

      return mapPrismaToDomain(result);
    },

    async findByNumber(context, number) {
      const result = await prisma.invoice.findFirst({
        where: {
          organizationId: context.organizationId,
          number,
        },
      });
      return result ? mapPrismaToDomain(result) : null;
    },

    async findWithoutExpectedDate(context) {
      const results = await prisma.invoice.findMany({
        where: {
          organizationId: context.organizationId,
          expectedPaymentDate: null,
          status: { notIn: ["PAID", "CANCELLED"] },
        },
        orderBy: { dueDate: "asc" },
      });
      return results.map(mapPrismaToDomain);
    },

    async findDueDateToday(context, today) {
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      const results = await prisma.invoice.findMany({
        where: {
          organizationId: context.organizationId,
          dueDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: { notIn: ["PAID", "CANCELLED"] },
        },
        orderBy: { dueDate: "asc" },
      });
      return results.map(mapPrismaToDomain);
    },

    async findOverdue(context, today) {
      const results = await prisma.invoice.findMany({
        where: {
          organizationId: context.organizationId,
          dueDate: { lt: today },
          status: { notIn: ["PAID", "CANCELLED"] },
        },
        orderBy: { dueDate: "asc" },
      });
      return results.map(mapPrismaToDomain);
    },

    async findWithPromiseToday(context, today) {
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      const results = await prisma.invoice.findMany({
        where: {
          organizationId: context.organizationId,
          paymentPromiseDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: { notIn: ["PAID", "CANCELLED"] },
        },
        orderBy: { paymentPromiseDate: "asc" },
      });
      return results.map(mapPrismaToDomain);
    },

    async findWithPromiseMissed(context, today) {
      const results = await prisma.invoice.findMany({
        where: {
          organizationId: context.organizationId,
          paymentPromiseDate: { lt: today },
          status: { notIn: ["PAID", "CANCELLED"] },
        },
        orderBy: { paymentPromiseDate: "asc" },
      });
      return results.map(mapPrismaToDomain);
    },

    async searchByNumberOrCompany(context, query, limit = 100) {
      const results = await prisma.invoice.findMany({
        where: {
          organizationId: context.organizationId,
          OR: [
            { number: { contains: query, mode: "insensitive" } },
            {
              customerCompany: {
                name: { contains: query, mode: "insensitive" },
              },
            },
          ],
        },
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          customerCompany: {
            select: { name: true },
          },
        },
      });
      return results.map(mapPrismaToDomain);
    },

    async countByFilters(context, filters) {
      const where: any = {
        organizationId: context.organizationId,
      };

      if (filters.customerCompanyId) {
        where.customerCompanyId = filters.customerCompanyId;
      }

      if (filters.status && filters.status.length > 0) {
        where.status = { in: filters.status };
      }

      if (filters.expectedPaymentDateFrom || filters.expectedPaymentDateTo) {
        where.expectedPaymentDate = {};
        if (filters.expectedPaymentDateFrom) {
          where.expectedPaymentDate.gte = filters.expectedPaymentDateFrom;
        }
        if (filters.expectedPaymentDateTo) {
          where.expectedPaymentDate.lte = filters.expectedPaymentDateTo;
        }
      }

      if (filters.nextActionAtFrom || filters.nextActionAtTo) {
        where.nextActionAt = {};
        if (filters.nextActionAtFrom) {
          where.nextActionAt.gte = filters.nextActionAtFrom;
        }
        if (filters.nextActionAtTo) {
          where.nextActionAt.lte = filters.nextActionAtTo;
        }
      }

      if (filters.dateOrigin) {
        where.dateOrigin = filters.dateOrigin;
      }

      if (filters.search) {
        where.OR = [
          { number: { contains: filters.search, mode: "insensitive" } },
          { description: { contains: filters.search, mode: "insensitive" } },
          {
            customerCompany: {
              name: { contains: filters.search, mode: "insensitive" },
            },
          },
        ];
      }

      return prisma.invoice.count({ where });
    },

    async findWithRelations(context, id) {
      const result = await prisma.invoice.findFirst({
        where: {
          id,
          organizationId: context.organizationId,
        },
        include: {
          customerCompany: {
            select: {
              id: true,
              name: true,
              legalName: true,
            },
          },
          dateHistory: {
            orderBy: { createdAt: "desc" },
          },
        },
      });
      return result ? mapPrismaToDomain(result) : null;
    },
  };
}
