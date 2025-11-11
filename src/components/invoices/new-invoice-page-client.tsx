"use client";

import { useRouter } from "next/navigation";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import type { CustomerCompany } from "@/lib/domain";

type NewInvoicePageClientProps = {
  companies: CustomerCompany[];
};

export function NewInvoicePageClient({ companies }: NewInvoicePageClientProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nueva Factura</h1>
        <p className="text-sm text-muted-foreground">
          Crea una nueva factura para una empresa cliente
        </p>
      </div>

      <InvoiceForm
        open={true}
        onOpenChange={(open) => {
          if (!open) {
            router.push("/portfolio/invoices");
          }
        }}
        companies={companies}
        onSuccess={() => {
          router.push("/portfolio/invoices");
        }}
      />
    </div>
  );
}

