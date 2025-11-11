"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ContactTable } from "./contact-table";
import { ContactFilters } from "./contact-filters";
import { BulkActionsToolbar } from "./bulk-actions-toolbar";
import { ContactDrawer } from "./contact-drawer";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/skeletons";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { hasPermission } from "@/lib/utils/permissions";
import type { Contact } from "@/lib/domain";
import type { CustomerCompany } from "@/lib/domain";
import type { MembershipRole } from "@prisma/client";

type ContactsListClientProps = {
  initialContacts: Contact[];
  initialTotal: number;
  initialCursor: string | null;
  companies: CustomerCompany[];
  userRole?: MembershipRole;
};

export function ContactsListClient({
  initialContacts,
  initialTotal,
  initialCursor,
  companies,
  userRole,
}: ContactsListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [contacts, setContacts] = useState(initialContacts);
  const [total, setTotal] = useState(initialTotal);
  const [cursor, setCursor] = useState(initialCursor);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleFilterChange = (filters: Record<string, string | undefined>) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });
      params.delete("cursor"); // Reset pagination on filter change
      router.push(`/portfolio/contacts?${params.toString()}`);
    });
  };

  const handleSearch = (search: string) => {
    handleFilterChange({ search });
  };

  const handleLoadMore = async () => {
    if (!cursor) return;

    startTransition(async () => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("cursor", cursor);
      router.push(`/portfolio/contacts?${params.toString()}`);
    });
  };

  const handleContactClick = (contact: Contact) => {
    setSelectedContact(contact);
    setDrawerOpen(true);
  };

  const handleOptOutChange = async (channel: "email" | "whatsapp", optedOut: boolean) => {
    if (!selectedContact) return;

    try {
      const response = await fetch(`/api/portfolio/contacts/${selectedContact.id}/optout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, optedOut }),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar opt-out");
      }

      const updated = await response.json();
      setSelectedContact(updated);
      // Update in list
      setContacts((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );
      router.refresh();
    } catch (error) {
      console.error("Error updating opt-out:", error);
      alert("Error al actualizar opt-out");
    }
  };

  const handleBulkOptOut = async (channel: "email" | "whatsapp", optedOut: boolean) => {
    try {
      const response = await fetch("/api/portfolio/contacts/bulk/optout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactIds: selectedIds, channel, optedOut }),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar opt-out");
      }

      setSelectedIds([]);
      router.refresh();
    } catch (error) {
      console.error("Error bulk updating opt-out:", error);
      alert("Error al actualizar opt-out");
    }
  };

  if (contacts.length === 0 && !isPending) {
    return (
      <EmptyState
        title="No hay contactos"
        description="Importa tu primera hoja o crea un contacto"
        action={
          <>
            {hasPermission(userRole, "contacts:import") && (
              <Button variant="outline" asChild className="mr-2">
                <Link href="/settings/data">Importar CSV</Link>
              </Button>
            )}
            {hasPermission(userRole, "contacts:create") && (
              <Button asChild>
                <Link href="/portfolio/contacts/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear contacto
                </Link>
              </Button>
            )}
          </>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ContactFilters
        companies={companies}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        initialSearch={searchParams.get("search") || ""}
      />

      {selectedIds.length > 0 && hasPermission(userRole, "contacts:manage_optout") && (
        <BulkActionsToolbar
          selectedCount={selectedIds.length}
          onCancel={() => setSelectedIds([])}
          onBulkOptOut={handleBulkOptOut}
        />
      )}

      {isPending && contacts.length === 0 ? (
        <TableSkeleton rows={5} columns={6} />
      ) : (
        <>
          <ContactTable
            contacts={contacts}
            onContactClick={handleContactClick}
            selectedIds={selectedIds}
            onSelectionChange={hasPermission(userRole, "contacts:manage_optout") ? setSelectedIds : undefined}
            userRole={userRole}
          />

          {cursor && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                loading={isPending}
                loadingText="Cargando más contactos..."
              >
                Cargar más
              </Button>
            </div>
          )}

          <div className="text-sm text-muted-foreground text-center">
            Mostrando {contacts.length} de {total} contactos
          </div>
        </>
      )}

      {selectedContact && (
        <ContactDrawer
          open={drawerOpen}
          onOpenChange={(open) => {
            setDrawerOpen(open);
            if (!open) {
              setSelectedContact(null);
            }
          }}
          contact={selectedContact}
          onEdit={() => {
            setDrawerOpen(false);
            // Small delay to ensure drawer closes before navigation
            setTimeout(() => {
              router.push(`/portfolio/contacts/${selectedContact?.id}/edit`);
            }, 100);
          }}
          onDelete={async () => {
            if (!confirm("¿Estás seguro de que deseas eliminar este contacto?")) {
              return;
            }

            try {
              const response = await fetch(`/api/portfolio/contacts/${selectedContact.id}`, {
                method: "DELETE",
              });

              if (!response.ok) {
                throw new Error("Error al eliminar contacto");
              }

              setDrawerOpen(false);
              setSelectedContact(null);
              router.refresh();
            } catch (error) {
              console.error("Error deleting contact:", error);
              alert("Error al eliminar contacto");
            }
          }}
          onOptOutChange={handleOptOutChange}
          userRole={userRole}
        />
      )}
    </div>
  );
}

