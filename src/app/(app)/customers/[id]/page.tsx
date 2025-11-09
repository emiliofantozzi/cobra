import { requireSession } from "@/lib/services/session";
import { getServices } from "@/lib/services/get-services";
import { notFound } from "next/navigation";
import { CustomerOverview } from "@/components/customers/customer-overview";
import { ContactsList } from "@/components/customers/contacts-list";
import { InvoicesList } from "@/components/customers/invoices-list";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

type CustomerDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CustomerDetailPage({
  params,
}: CustomerDetailPageProps) {
  const { id } = await params;
  const session = await requireSession({ redirectTo: "/" });

  // El layout ya verifica que haya organización activa
  if (!session.organization?.id) {
    return null;
  }

  const context = {
    organizationId: session.organization.id,
    actorId: session.user.id,
  };

  const { customersService, invoicesService } = getServices(context);
  const customer = await customersService.getCustomerCompany(context, id as any);

  if (!customer) {
    notFound();
  }

  const contactsResult = await customersService.listContacts(context, {
    customerCompanyId: id as any,
    pagination: { limit: 50 },
  });

  const invoicesResult = await invoicesService.listInvoices(context, {
    customerCompanyId: id as any,
    pagination: { limit: 50 },
  });

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/customers">Clientes</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>{customer.name}</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <CustomerOverview customer={customer} />

      <div className="grid gap-6 md:grid-cols-2">
        <ContactsList contacts={contactsResult.data} customerId={customer.id} />
        <InvoicesList invoices={invoicesResult.data} customerId={customer.id} />
      </div>
    </div>
  );
}

