import { requireSession } from "@/lib/services/session";
import { getServices } from "@/lib/services/get-services";
import { InvoiceTable } from "@/components/invoices/invoice-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

export default async function InvoicesPage() {
  const session = await requireSession({ redirectTo: "/" });

  // El layout ya verifica que haya organización activa
  if (!session.organization?.id) {
    return null;
  }

  const context = {
    organizationId: session.organization.id,
    actorId: session.user.id,
  };

  const { invoicesService } = getServices(context);
  const result = await invoicesService.listInvoices(context, {
    pagination: { limit: 50 },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Facturas</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona tus facturas y cuotas
          </p>
        </div>
        <Link href="/invoices/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva factura
          </Button>
        </Link>
      </div>

      {result.data.length === 0 ? (
        <EmptyState
          title="No hay facturas"
          description="Comienza agregando tu primera factura."
          action={
            <Link href="/invoices/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Agregar factura
              </Button>
            </Link>
          }
        />
      ) : (
        <InvoiceTable invoices={result.data} />
      )}
    </div>
  );
}

