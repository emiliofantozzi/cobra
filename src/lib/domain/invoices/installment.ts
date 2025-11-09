import { assertDomain } from "../errors";
import type { InstallmentId, InvoiceId, OrganizationId } from "../types";

export type InstallmentStatus = "PENDING" | "PAID" | "OVERDUE" | "CANCELLED";

export interface Installment {
  id: InstallmentId;
  organizationId: OrganizationId;
  invoiceId: InvoiceId;
  sequence: number;
  dueDate: Date;
  amount: number;
  status: InstallmentStatus;
  paidAmount: number;
  paidAt?: Date | null;
  notes?: string;
  metadata?: unknown;
  createdAt: Date;
  updatedAt: Date;
}

export interface InstallmentDraft {
  organizationId: OrganizationId;
  invoiceId: InvoiceId;
  sequence: number;
  dueDate: Date;
  amount: number;
  notes?: string;
  metadata?: unknown;
}

export function createInstallment(input: InstallmentDraft): Omit<Installment, "id" | "status" | "paidAmount" | "paidAt" | "createdAt" | "updatedAt"> & {
  status: InstallmentStatus;
  paidAmount: number;
  paidAt: null;
} {
  assertDomain(input.sequence >= 1, "Installment sequence must be >= 1", { code: "installment.invalid_sequence" });
  assertDomain(input.amount > 0, "Installment amount must be greater than zero", { code: "installment.invalid_amount" });

  return {
    organizationId: input.organizationId,
    invoiceId: input.invoiceId,
    sequence: input.sequence,
    dueDate: input.dueDate,
    amount: Number(input.amount),
    status: "PENDING",
    paidAmount: 0,
    paidAt: null,
    notes: input.notes?.trim() || undefined,
    metadata: input.metadata,
  };
}

export function determineInstallmentStatus(installment: Installment, today: Date = new Date()): InstallmentStatus {
  if (installment.status === "CANCELLED") {
    return "CANCELLED";
  }

  if (installment.paidAmount >= installment.amount) {
    return "PAID";
  }

  return installment.dueDate < today ? "OVERDUE" : "PENDING";
}

export type InstallmentCreateData = ReturnType<typeof createInstallment>;

