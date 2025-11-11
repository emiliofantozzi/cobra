import { requireSession } from "@/lib/services/session";
import { getServices } from "@/lib/services/get-services";
import { ContactsListClient } from "@/components/portfolio/contacts/contacts-list-client";
import { hasPermission } from "@/lib/utils/permissions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Upload } from "lucide-react";
import type { MembershipRole } from "@prisma/client";

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await requireSession({ redirectTo: "/" });

  if (!session.organization?.id) {
    return null;
  }

  const params = await searchParams;
  const context = {
    organizationId: session.organization.id,
    actorId: session.user.id,
  };

  const { contactsService, customersService } = getServices(context);

  // Get initial data
  const result = await contactsService.listContacts(context, {
    pagination: { limit: 25 },
    search: typeof params.search === "string" ? params.search : undefined,
    customerCompanyId: typeof params.company === "string" ? params.company : undefined,
    hasWhatsapp: typeof params.hasWhatsapp === "string" ? params.hasWhatsapp === "true" : undefined,
    hasEmail: typeof params.hasEmail === "string" ? params.hasEmail === "true" : undefined,
    optedOutEmail: typeof params.optedOutEmail === "string" ? params.optedOutEmail === "true" : undefined,
    optedOutWhatsapp:
      typeof params.optedOutWhatsapp === "string" ? params.optedOutWhatsapp === "true" : undefined,
    role: typeof params.role === "string" ? params.role : undefined,
    preferredChannel: typeof params.channel === "string" ? params.channel : undefined,
    isPrimary: typeof params.isPrimary === "string" ? params.isPrimary === "true" : undefined,
    isBillingContact:
      typeof params.isBillingContact === "string" ? params.isBillingContact === "true" : undefined,
  });

  // Get companies for filter dropdown
  const companiesResult = await customersService.listCustomerCompanies(context, {
    pagination: { limit: 100 },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contactos</h1>
          <p className="text-sm text-muted-foreground">Gestiona los contactos de tus clientes</p>
        </div>
        <div className="flex items-center gap-2">
          {hasPermission(session.user.role as MembershipRole, "contacts:import") && (
            <Button variant="outline" asChild>
              <Link href="/settings/data">
                <Upload className="mr-2 h-4 w-4" />
                Importar
              </Link>
            </Button>
          )}
          {hasPermission(session.user.role as MembershipRole, "contacts:create") && (
            <Button asChild>
              <Link href="/portfolio/contacts/new">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo contacto
              </Link>
            </Button>
          )}
        </div>
      </div>

      <ContactsListClient
        initialContacts={result.data}
        initialTotal={result.totalCount ?? 0}
        initialCursor={result.nextCursor ?? null}
        companies={companiesResult.data}
        userRole={session.user.role as MembershipRole}
      />
    </div>
  );
}
