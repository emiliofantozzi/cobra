import { requireSession } from "@/lib/services/session";
import { getServices } from "@/lib/services/get-services";
import { ContactTable } from "@/components/contacts/contact-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

export default async function ContactsPage() {
  const session = await requireSession({ redirectTo: "/" });

  // El layout ya verifica que haya organización activa
  if (!session.organization?.id) {
    return null;
  }

  const context = {
    organizationId: session.organization.id,
    actorId: session.user.id,
  };

  const { customersService } = getServices(context);
  const result = await customersService.listContacts(context, {
    pagination: { limit: 50 },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contactos</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona los contactos de tus clientes
          </p>
        </div>
        <Link href="/contacts/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo contacto
          </Button>
        </Link>
      </div>

      {result.data.length === 0 ? (
        <EmptyState
          title="No hay contactos"
          description="Comienza agregando tu primer contacto."
          action={
            <Link href="/contacts/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Agregar contacto
              </Button>
            </Link>
          }
        />
      ) : (
        <ContactTable contacts={result.data} />
      )}
    </div>
  );
}

