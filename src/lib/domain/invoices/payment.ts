import { assertDomain } from "../errors";
import type { InstallmentId, InvoiceId, OrganizationId, PaymentId, CurrencyCode } from "../types";

export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED" | "REFUNDED";

export interface Payment {
  id: PaymentId;
  organizationId: OrganizationId;
  invoiceId: InvoiceId;
  installmentId?: InstallmentId;
  amount: number;
  currency: CurrencyCode;
  paidAt?: Date;
  method?: string;
  reference?: string;
  status: PaymentStatus;
  notes?: string;
  metadata?: unknown;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentDraft {
  organizationId: OrganizationId;
  invoiceId: InvoiceId;
  installmentId?: InstallmentId;
  amount: number;
  currency?: CurrencyCode;
  paidAt?: Date;
  method?: string;
  reference?: string;
  notes?: string;
  metadata?: unknown;
  status?: PaymentStatus;
}

export function createPayment(input: PaymentDraft): Omit<Payment, "id" | "createdAt" | "updatedAt"> {
  assertDomain(input.amount > 0, "Payment amount must be greater than zero", { code: "payment.invalid_amount" });

  const status: PaymentStatus = input.status ?? (input.paidAt ? "COMPLETED" : "PENDING");

  return {
    organizationId: input.organizationId,
    invoiceId: input.invoiceId,
    installmentId: input.installmentId,
    amount: Number(input.amount),
    currency: (input.currency ?? "USD").toUpperCase(),
    paidAt: input.paidAt,
    method: input.method?.trim() || undefined,
    reference: input.reference?.trim() || undefined,
    status,
    notes: input.notes?.trim() || undefined,
    metadata: input.metadata,
  };
}

export type PaymentCreateData = ReturnType<typeof createPayment>;

