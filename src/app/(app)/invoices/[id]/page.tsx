import { requireSession } from "@/lib/services/session";
import { getServices } from "@/lib/services/get-services";
import { notFound } from "next/navigation";
import { InvoiceDetail } from "@/components/invoices/invoice-detail";
import { InstallmentsTable } from "@/components/invoices/installments-table";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

type InvoiceDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function InvoiceDetailPage({
  params,
}: InvoiceDetailPageProps) {
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

  const { invoicesService } = getServices(context);
  const invoice = await invoicesService.getInvoice(context, id as any);

  if (!invoice) {
    notFound();
  }

  // Get installments - we'll need to check the repository for this
  // For now, we'll pass empty array
  const installments: any[] = [];

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/invoices">Facturas</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            {invoice.number || `Factura #${invoice.id.slice(0, 8)}`}
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <InvoiceDetail invoice={invoice} />
      <InstallmentsTable installments={installments} invoiceId={invoice.id} />
    </div>
  );
}

