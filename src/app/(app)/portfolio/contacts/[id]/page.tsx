import { requireSession } from "@/lib/services/session";
import { getServices } from "@/lib/services/get-services";
import { ContactDetailClient } from "@/components/portfolio/contacts/contact-detail-client";
import { notFound } from "next/navigation";

export default async function ContactDetailPage({
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

  return <ContactDetailClient contact={contact} companies={companiesResult.data} />;
}

