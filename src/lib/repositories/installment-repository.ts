import type { Installment, InstallmentId, InstallmentCreateData, InvoiceId, InstallmentStatus } from "../domain";
import { prisma } from "../db";
import type { RepositoryContext } from "./types";

export interface InstallmentRepository {
  findById(context: RepositoryContext, id: InstallmentId): Promise<Installment | null>;
  listByInvoice(context: RepositoryContext, invoiceId: InvoiceId): Promise<Installment[]>;
  createMany(context: RepositoryContext, data: InstallmentCreateData[]): Promise<Installment[]>;
  updateStatus(context: RepositoryContext, id: InstallmentId, status: InstallmentStatus): Promise<Installment>;
  updatePaidAmount(
    context: RepositoryContext,
    id: InstallmentId,
    payload: { paidAmount: number; paidAt?: Date | null },
  ): Promise<Installment>;
}

function mapPrismaToDomain(prismaModel: {
  id: string;
  organizationId: string;
  invoiceId: string;
  sequence: number;
  dueDate: Date;
  amount: any; // Decimal
  status: string;
  paidAmount: any; // Decimal
  paidAt: Date | null;
  notes: string | null;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}): Installment {
  return {
    id: prismaModel.id as InstallmentId,
    organizationId: prismaModel.organizationId,
    invoiceId: prismaModel.invoiceId,
    sequence: prismaModel.sequence,
    dueDate: prismaModel.dueDate,
    amount: Number(prismaModel.amount),
    status: prismaModel.status as InstallmentStatus,
    paidAmount: Number(prismaModel.paidAmount),
    paidAt: prismaModel.paidAt ?? undefined,
    notes: prismaModel.notes ?? undefined,
    metadata: prismaModel.metadata ?? undefined,
    createdAt: prismaModel.createdAt,
    updatedAt: prismaModel.updatedAt,
  };
}

export function createInstallmentRepository(): InstallmentRepository {
  return {
    async findById(context, id) {
      const result = await prisma.installment.findFirst({
        where: {
          id,
          organizationId: context.organizationId,
        },
      });
      return result ? mapPrismaToDomain(result) : null;
    },

    async listByInvoice(context, invoiceId) {
      const results = await prisma.installment.findMany({
        where: {
          invoiceId,
          organizationId: context.organizationId,
        },
        orderBy: { sequence: "asc" },
      });
      return results.map(mapPrismaToDomain);
    },

    async createMany(context, data) {
      const results = await prisma.installment.createManyAndReturn({
        data: data.map((item) => ({
          organizationId: context.organizationId,
          invoiceId: item.invoiceId,
          sequence: item.sequence,
          dueDate: item.dueDate,
          amount: item.amount,
          status: item.status,
          paidAmount: item.paidAmount,
          paidAt: item.paidAt,
          notes: item.notes,
          metadata: item.metadata as any,
        })),
      });
      return results.map(mapPrismaToDomain);
    },

    async updateStatus(context, id, status) {
      const result = await prisma.installment.update({
        where: {
          id,
          organizationId: context.organizationId,
        },
        data: { status },
      });
      return mapPrismaToDomain(result);
    },

    async updatePaidAmount(context, id, payload) {
      const updateData: any = {
        paidAmount: payload.paidAmount,
      };
      if (payload.paidAt !== undefined) {
        updateData.paidAt = payload.paidAt;
      }
      const result = await prisma.installment.update({
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
