import { requireSession } from "@/lib/services/session";
import { getServices } from "@/lib/services/get-services";
import { CustomerTable } from "@/components/customers/customer-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Upload } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Input } from "@/components/ui/input";

export default async function CompaniesPage() {
  const session = await requireSession({ redirectTo: "/" });

  if (!session.organization?.id) {
    return null;
  }

  const context = {
    organizationId: session.organization.id,
    actorId: session.user.id,
  };

  const { customersService } = getServices(context);
  const result = await customersService.listCustomerCompanies(context, {
    pagination: { limit: 50 },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Empresas</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona las empresas clientes de tu organización
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/settings/data">
              <Upload className="mr-2 h-4 w-4" />
              Importar CSV
            </Link>
          </Button>
          <Button asChild>
            <Link href="/portfolio/companies/new">
              <Plus className="mr-2 h-4 w-4" />
              Nueva empresa
            </Link>
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-2">
        <Input placeholder="Buscar empresas..." className="max-w-sm" />
      </div>

      {result.data.length === 0 ? (
        <EmptyState
          title="No hay empresas"
          description="Importa tu primera hoja o crea una empresa manualmente."
          action={
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/settings/data">
                  <Upload className="mr-2 h-4 w-4" />
                  Importar CSV
                </Link>
              </Button>
              <Button asChild>
                <Link href="/portfolio/companies/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear empresa
                </Link>
              </Button>
            </div>
          }
        />
      ) : (
        <CustomerTable customers={result.data} />
      )}
    </div>
  );
}

