import { requireSession } from "@/lib/services/session";
import { getServices } from "@/lib/services/get-services";
import { InvoiceTable } from "@/components/invoices/invoice-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Edit } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// TODO: Replace with API call in Phase 3
const mockFilterChips = [
  { label: "Sin fecha", count: 12, active: false },
  { label: "Vencen hoy", count: 5, active: false },
  { label: "Vencidas", count: 23, active: true },
  { label: "Con promesa", count: 3, active: false },
];

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
        <Button asChild>
          <Link href="/portfolio/invoices/new">
            <Plus className="mr-2 h-4 w-4" />
            Nueva factura
          </Link>
        </Button>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        {mockFilterChips.map((chip) => (
          <Button
            key={chip.label}
            variant={chip.active ? "default" : "outline"}
            size="sm"
            className="gap-2"
          >
            {chip.label}
            <Badge variant="secondary" className="ml-1">
              {chip.count}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <Input placeholder="Buscar facturas..." className="max-w-sm" />
      </div>

      {/* Bulk Actions Toolbar - TODO: Implement selection state in Phase 3 */}
      {false && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-2">
          <span className="text-sm text-muted-foreground">
            3 facturas seleccionadas
          </span>
          <Button variant="outline" size="sm" className="gap-2">
            <Edit className="h-4 w-4" />
            Editar fecha esperada
          </Button>
        </div>
      )}

      {result.data.length === 0 ? (
        <EmptyState
          title="No hay facturas"
          description="Comienza agregando tu primera factura o importa desde CSV."
          action={
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/settings/data">Importar CSV</Link>
              </Button>
              <Button asChild>
                <Link href="/portfolio/invoices/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar factura
                </Link>
              </Button>
            </div>
          }
        />
      ) : (
        <InvoiceTable invoices={result.data} />
      )}
    </div>
  );
}

