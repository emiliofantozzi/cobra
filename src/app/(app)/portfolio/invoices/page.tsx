import { requireSession } from "@/lib/services/session";
import { getServices } from "@/lib/services/get-services";
import { InvoiceFilterChips } from "@/components/invoices/invoice-filter-chips";
import { InvoiceSearch } from "@/components/invoices/invoice-search";
import { InvoicesListClient } from "@/components/invoices/invoices-list-client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function InvoicesPage() {
  const session = await requireSession({ redirectTo: "/" });

  if (!session.organization?.id) {
    return null;
  }

  const context = {
    organizationId: session.organization.id,
    actorId: session.user.id,
  };

  const { invoicesService } = getServices(context);
  const [result, chipCounts] = await Promise.all([
    invoicesService.listInvoices(context, {
      pagination: { limit: 50 },
    }),
    invoicesService.getChipCounts(context),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Facturas</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona tus facturas y cuotas
          </p>
        </div>
        <Button asChild>
          <Link href="/portfolio/invoices/new">
            <Plus className="mr-2 h-4 w-4" />
            Nueva factura
          </Link>
        </Button>
      </div>

      {/* Filter Chips */}
      <InvoiceFilterChips initialCounts={chipCounts} />

      {/* Search */}
      <InvoiceSearch />

      {/* Invoices List */}
      <InvoicesListClient
        initialInvoices={result.data}
        initialChipCounts={chipCounts}
      />
    </div>
  );
}

