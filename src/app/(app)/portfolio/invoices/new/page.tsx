import { requireSession } from "@/lib/services/session";
import { getServices } from "@/lib/services/get-services";
import { NewInvoicePageClient } from "@/components/invoices/new-invoice-page-client";
import { redirect } from "next/navigation";

export default async function NewInvoicePage() {
  const session = await requireSession({ redirectTo: "/" });

  if (!session.organization?.id) {
    return null;
  }

  const context = {
    organizationId: session.organization.id,
    actorId: session.user.id,
  };

  const { customersService } = getServices(context);
  const companiesResult = await customersService.listCustomerCompanies(context, {
    status: ["ACTIVE"],
    pagination: { limit: 1000 },
  });

  if (companiesResult.data.length === 0) {
    redirect("/portfolio/companies?message=Necesitas crear al menos una empresa cliente antes de crear facturas");
  }

  return <NewInvoicePageClient companies={companiesResult.data} />;
}

