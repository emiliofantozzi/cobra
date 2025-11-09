import { requireSession } from "@/lib/services/session";
import { getServices } from "@/lib/services/get-services";
import { ContactTable } from "@/components/contacts/contact-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default async function ContactsPage() {
  const session = await requireSession({ redirectTo: "/" });

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
        <Button asChild>
          <Link href="/portfolio/contacts/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo contacto
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Input placeholder="Buscar contactos..." className="max-w-sm" />
        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por empresa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las empresas</SelectItem>
            {/* TODO: Replace with API call in Phase 3 */}
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="WhatsApp" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="with">Con WhatsApp</SelectItem>
            <SelectItem value="without">Sin WhatsApp</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Opt-out" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="opted-out">Opt-out activo</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {result.data.length === 0 ? (
        <EmptyState
          title="No hay contactos"
          description="Comienza agregando tu primer contacto."
          action={
            <Link href="/portfolio/contacts/new">
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

