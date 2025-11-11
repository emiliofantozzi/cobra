import type { Invoice } from "@/lib/domain/invoices/invoice";

export interface InvoiceWithCompany extends Invoice {
  customerCompany?: {
    id: string;
    name: string;
    legalName?: string;
  };
}

