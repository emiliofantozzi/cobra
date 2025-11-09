import { assertDomain, DomainError } from "../errors";
import type {
  CustomerCompanyId,
  InvoiceId,
  OrganizationId,
  CurrencyCode,
  JsonValue,
} from "../types";
import type { Installment } from "./installment";
import type { Payment } from "./payment";

export type InvoiceStatus = "DRAFT" | "PENDING" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "CANCELLED";

export interface Invoice {
  id: InvoiceId;
  organizationId: OrganizationId;
  customerCompanyId: CustomerCompanyId;
  number?: string;
  description?: string;
  issueDate: Date;
  dueDate: Date;
  amount: number;
  currency: CurrencyCode;
  status: InvoiceStatus;
  notes?: string;
  metadata?: JsonValue;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceDraft {
  organizationId: OrganizationId;
  customerCompanyId: CustomerCompanyId;
  number?: string;
  description?: string;
  issueDate: Date;
  dueDate: Date;
  amount: number;
  currency?: CurrencyCode;
  notes?: string;
  metadata?: JsonValue;
  status?: InvoiceStatus;
}

export function createInvoice(input: InvoiceDraft): Omit<Invoice, "id" | "createdAt" | "updatedAt"> {
  assertDomain(input.amount > 0, "Invoice must have an amount greater than zero", { code: "invoice.invalid_amount" });
  assertDomain(input.dueDate >= input.issueDate, "Due date cannot be before issue date", { code: "invoice.invalid_dates" });

  const status: InvoiceStatus = input.status ?? "PENDING";
  assertValidInvoiceStatusForDraft(status);

  return {
    organizationId: input.organizationId,
    customerCompanyId: input.customerCompanyId,
    number: input.number?.trim() || undefined,
    description: input.description?.trim() || undefined,
    issueDate: input.issueDate,
    dueDate: input.dueDate,
    amount: Number(input.amount),
    currency: (input.currency ?? "USD").toUpperCase(),
    status,
    notes: input.notes?.trim() || undefined,
    metadata: input.metadata,
  };
}

export function determineInvoiceStatus({
  invoice,
  installments,
  payments,
  today = new Date(),
}: {
  invoice: Invoice;
  installments: Installment[];
  payments: Payment[];
  today?: Date;
}): InvoiceStatus {
  if (invoice.status === "CANCELLED") {
    return "CANCELLED";
  }

  const outstanding = calculateOutstandingAmount(invoice.amount, payments);
  const isFullyPaid = outstanding <= 0;

  if (isFullyPaid) {
    return "PAID";
  }

  const hasAnyPayment = payments.some((payment) => payment.status === "COMPLETED");

  if (hasAnyPayment) {
    return invoice.dueDate < today ? "OVERDUE" : "PARTIALLY_PAID";
  }

  return invoice.dueDate < today ? "OVERDUE" : "PENDING";
}

export function calculateOutstandingAmount(invoiceAmount: number, payments: Payment[]): number {
  const settled = payments.reduce((sum, payment) => {
    if (payment.status !== "COMPLETED") {
      return sum;
    }
    return sum + payment.amount;
  }, 0);

  return Number((invoiceAmount - settled).toFixed(2));
}

function assertValidInvoiceStatusForDraft(status: InvoiceStatus): void {
  if (status === "PAID" || status === "OVERDUE" || status === "PARTIALLY_PAID") {
    throw new DomainError("Cannot create a new invoice directly with paid or overdue status", {
      code: "invoice.invalid_initial_status",
    });
  }
}

export type InvoiceCreateData = ReturnType<typeof createInvoice>;

