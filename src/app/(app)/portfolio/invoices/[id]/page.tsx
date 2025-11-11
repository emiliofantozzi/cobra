import { requireSession } from "@/lib/services/session";
import { getServices } from "@/lib/services/get-services";
import { InvoiceDrawerClient } from "@/components/invoices/invoice-drawer-client";
import { notFound } from "next/navigation";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export default async function InvoiceDetailPage({ params }: RouteParams) {
  const session = await requireSession({ redirectTo: "/" });

  if (!session.organization?.id) {
    return null;
  }

  const { id } = await params;
  const context = {
    organizationId: session.organization.id,
    actorId: session.user.id,
  };

  const { invoicesService } = getServices(context);
  const invoice = await invoicesService.getInvoice(context, id as any);

  if (!invoice) {
    notFound();
  }

  // Get customer company for the extended type
  const { customersService } = getServices(context);
  const company = await customersService.getCustomerCompany(context, invoice.customerCompanyId);

  const invoiceWithCompany: any = {
    ...invoice,
    customerCompany: company
      ? {
          id: company.id,
          name: company.name,
          legalName: company.legalName,
        }
      : undefined,
  };

  return <InvoiceDrawerClient invoice={invoiceWithCompany} userRole={session.user.role} />;
}

