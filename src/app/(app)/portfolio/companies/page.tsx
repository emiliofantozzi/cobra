import { requireSession } from "@/lib/services/session";
import { getServices } from "@/lib/services/get-services";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Upload } from "lucide-react";
import { CompaniesList } from "@/components/portfolio/companies/companies-list";
import { hasPermission } from "@/lib/utils/permissions";
import type { MembershipRole } from "@prisma/client";

type CompaniesPageProps = {
  searchParams: Promise<{
    search?: string;
    status?: string;
    sortBy?: string;
    sortDirection?: string;
    limit?: string;
    cursor?: string;
  }>;
};

export default async function CompaniesPage({ searchParams }: CompaniesPageProps) {
  const session = await requireSession({ redirectTo: "/" });

  if (!session.organization?.id) {
    return null;
  }

  const params = await searchParams;
  const context = {
    organizationId: session.organization.id,
    actorId: session.user.id,
  };

  const status = params.status?.split(",").filter(Boolean) as any;
  const search = params.search || undefined;
  const limit = parseInt(params.limit || "25", 10);
  const cursor = params.cursor || undefined;
  const sortBy = (params.sortBy || "createdAt") as "name" | "createdAt";
  const sortDirection = (params.sortDirection || "desc") as "asc" | "desc";

  const { customersService } = getServices(context);
  const result = await customersService.listCustomerCompanies(context, {
    status,
    search,
    pagination: { limit, cursor },
    sortBy,
    sortDirection,
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
        {hasPermission(session.user.role as MembershipRole, "companies:create") && (
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
        )}
      </div>

      <CompaniesList
        initialData={result.data}
        initialTotalCount={result.totalCount}
        initialCursor={result.nextCursor || null}
        userRole={session.user.role as MembershipRole}
      />
    </div>
  );
}

