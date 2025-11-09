import { requireSession } from "@/lib/services/session";
import { getServices } from "@/lib/services/get-services";
import { notFound } from "next/navigation";
import { CustomerOverview } from "@/components/customers/customer-overview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContactsList } from "@/components/customers/contacts-list";
import { InvoicesList } from "@/components/customers/invoices-list";

type CustomerDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const session = await requireSession({ redirectTo: "/" });

  if (!session.organization?.id) {
    return null;
  }

  const { id } = await params;

  const context = {
    organizationId: session.organization.id,
    actorId: session.user.id,
  };

  const { customersService, invoicesService } = getServices(context);
  const customer = await customersService.getCustomerCompany(context, id as any);

  if (!customer) {
    notFound();
  }

  const [contactsResult, invoicesResult] = await Promise.all([
    customersService.listContacts(context, {
      customerCompanyId: id as any,
      pagination: { limit: 50 },
    }),
    invoicesService.listInvoices(context, {
      customerCompanyId: id as any,
      pagination: { limit: 50 },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{customer.name}</h1>
        <p className="text-sm text-muted-foreground">
          Vista 360º de la empresa cliente
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Datos</TabsTrigger>
          <TabsTrigger value="contacts">Contactos</TabsTrigger>
          <TabsTrigger value="invoices">Facturas</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <CustomerOverview customer={customer} />
        </TabsContent>
        <TabsContent value="contacts" className="space-y-4">
          <ContactsList contacts={contactsResult.data} customerId={customer.id} />
        </TabsContent>
        <TabsContent value="invoices" className="space-y-4">
          <InvoicesList invoices={invoicesResult.data} customerId={customer.id} />
        </TabsContent>
        <TabsContent value="timeline" className="space-y-4">
          {/* TODO: Replace with API call in Phase 3 - Timeline component */}
          <div className="text-center py-12 text-muted-foreground">
            Timeline de interacciones (próximamente)
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

