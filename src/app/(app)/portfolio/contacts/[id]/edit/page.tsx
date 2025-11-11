import { requireSession } from "@/lib/services/session";
import { getServices } from "@/lib/services/get-services";
import { ContactFormClient } from "@/components/portfolio/contacts/contact-form-client";
import { notFound } from "next/navigation";

export default async function EditContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession({ redirectTo: "/" });

  if (!session.organization?.id) {
    return null;
  }

  const { id } = await params;
  const context = {
    organizationId: session.organization.id,
    actorId: session.user.id,
  };

  const { contactsService, customersService } = getServices(context);
  const contact = await contactsService.getContact(context, id as any);

  if (!contact) {
    notFound();
  }

  const companiesResult = await customersService.listCustomerCompanies(context, {
    pagination: { limit: 100 },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Editar Contacto</h1>
        <p className="text-sm text-muted-foreground">Actualiza la información del contacto</p>
      </div>

      <ContactFormClient companies={companiesResult.data} contact={contact} />
    </div>
  );
}

