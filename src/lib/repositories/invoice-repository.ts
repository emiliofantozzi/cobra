import type {
  Invoice,
  InvoiceDraft,
  InvoiceId,
  InvoiceStatus,
  InvoiceCreateData,
  CustomerCompanyId,
} from "../domain";
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
  list(context: RepositoryContext, params?: ListInvoicesParams): Promise<PaginatedResult<Invoice>>;
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
        ];
      }

      const [data, totalCount] = await Promise.all([
        prisma.invoice.findMany({
          where,
          take: limit + 1,
          cursor: cursor ? { id: cursor } : undefined,
          orderBy: { createdAt: "desc" },
        }),
        prisma.invoice.count({ where }),
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
  };
}
