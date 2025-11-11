import { requireSession } from "@/lib/services/session";
import { getServices } from "@/lib/services/get-services";
import { ContactFormClient } from "@/components/portfolio/contacts/contact-form-client";

export default async function NewContactPage() {
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
    pagination: { limit: 100 },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nuevo Contacto</h1>
        <p className="text-sm text-muted-foreground">Crea un nuevo contacto para tu organización</p>
      </div>

      <ContactFormClient companies={companiesResult.data} />
    </div>
  );
}

