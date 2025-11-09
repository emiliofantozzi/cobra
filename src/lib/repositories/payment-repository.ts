import type { Payment, PaymentId, PaymentCreateData, InvoiceId, InstallmentId, PaymentStatus } from "../domain";
import { prisma } from "../db";
import type { PaginatedResult, PaginationParams, RepositoryContext, SortDirection } from "./types";

export interface ListPaymentsParams {
  invoiceId?: InvoiceId;
  installmentId?: InstallmentId;
  status?: PaymentStatus[];
  pagination?: PaginationParams;
  sort?: {
    field: "paidAt" | "createdAt";
    direction?: SortDirection;
  };
}

export interface PaymentRepository {
  findById(context: RepositoryContext, id: PaymentId): Promise<Payment | null>;
  list(context: RepositoryContext, params?: ListPaymentsParams): Promise<PaginatedResult<Payment>>;
  create(context: RepositoryContext, data: PaymentCreateData): Promise<Payment>;
  updateStatus(
    context: RepositoryContext,
    id: PaymentId,
    payload: { status: PaymentStatus; paidAt?: Date | null; reference?: string },
  ): Promise<Payment>;
}

function mapPrismaToDomain(prismaModel: {
  id: string;
  organizationId: string;
  invoiceId: string;
  installmentId: string | null;
  amount: any; // Decimal
  currency: string;
  paidAt: Date | null;
  method: string | null;
  reference: string | null;
  status: string;
  notes: string | null;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}): Payment {
  return {
    id: prismaModel.id as PaymentId,
    organizationId: prismaModel.organizationId,
    invoiceId: prismaModel.invoiceId,
    installmentId: prismaModel.installmentId ?? undefined,
    amount: Number(prismaModel.amount),
    currency: prismaModel.currency,
    paidAt: prismaModel.paidAt ?? undefined,
    method: prismaModel.method ?? undefined,
    reference: prismaModel.reference ?? undefined,
    status: prismaModel.status as PaymentStatus,
    notes: prismaModel.notes ?? undefined,
    metadata: prismaModel.metadata ?? undefined,
    createdAt: prismaModel.createdAt,
    updatedAt: prismaModel.updatedAt,
  };
}

export function createPaymentRepository(): PaymentRepository {
  return {
    async findById(context, id) {
      const result = await prisma.payment.findFirst({
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

      if (params?.invoiceId) {
        where.invoiceId = params.invoiceId;
      }

      if (params?.installmentId) {
        where.installmentId = params.installmentId;
      }

      if (params?.status && params.status.length > 0) {
        where.status = { in: params.status };
      }

      const sortField = params?.sort?.field ?? "createdAt";
      const sortDirection = params?.sort?.direction ?? "desc";

      const [data, totalCount] = await Promise.all([
        prisma.payment.findMany({
          where,
          take: limit + 1,
          cursor: cursor ? { id: cursor } : undefined,
          orderBy: { [sortField]: sortDirection },
        }),
        prisma.payment.count({ where }),
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
      const result = await prisma.payment.create({
        data: {
          organizationId: context.organizationId,
          invoiceId: data.invoiceId,
          installmentId: data.installmentId,
          amount: data.amount,
          currency: data.currency,
          paidAt: data.paidAt,
          method: data.method,
          reference: data.reference,
          status: data.status,
          notes: data.notes,
          metadata: data.metadata as any,
        },
      });
      return mapPrismaToDomain(result);
    },

    async updateStatus(context, id, payload) {
      const updateData: any = {
        status: payload.status,
      };
      if (payload.paidAt !== undefined) {
        updateData.paidAt = payload.paidAt;
      }
      if (payload.reference !== undefined) {
        updateData.reference = payload.reference;
      }
      const result = await prisma.payment.update({
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
