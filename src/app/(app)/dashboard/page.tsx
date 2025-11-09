import { requireSession } from "@/lib/services/session";
import { getServices } from "@/lib/services/get-services";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { CaseStatusTable } from "@/components/dashboard/case-status-table";

export default async function DashboardPage() {
  const session = await requireSession({ redirectTo: "/" });

  // El layout ya verifica que haya organización activa, así que podemos asumir que existe
  if (!session.organization?.id) {
    return null; // Esto no debería ocurrir, pero por seguridad
  }

  const context = {
    organizationId: session.organization.id,
    actorId: session.user.id,
  };

  const { customersService, invoicesService, collectionCasesService } =
    getServices(context);

  const [customersResult, invoicesResult, casesResult] = await Promise.all([
    customersService.listCustomerCompanies(context, { pagination: { limit: 1 } }),
    invoicesService.listInvoices(context, { pagination: { limit: 1 } }),
    collectionCasesService.listCollectionCases(context, {
      status: ["ACTIVE"],
      pagination: { limit: 10 },
    }),
  ]);

  const overdueInvoices = await invoicesService.listInvoices(context, {
    status: ["OVERDUE"],
    pagination: { limit: 1 },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Resumen de tu actividad de cobranzas
        </p>
      </div>

      <SummaryCards
        totalCustomers={customersResult.totalCount}
        totalInvoices={invoicesResult.totalCount}
        activeCases={casesResult.totalCount}
        overdueInvoices={overdueInvoices.totalCount}
      />

      <CaseStatusTable cases={casesResult.data} />
    </div>
  );
}

