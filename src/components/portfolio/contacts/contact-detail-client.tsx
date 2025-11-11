"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ContactDrawer } from "./contact-drawer";
import { ContactForm } from "./contact-form";
import type { Contact, CustomerCompany } from "@/lib/domain";

type ContactDetailClientProps = {
  contact: Contact;
  companies: CustomerCompany[];
};

export function ContactDetailClient({ contact, companies }: ContactDetailClientProps) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [currentContact, setCurrentContact] = useState(contact);

  const handleEdit = () => {
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de que deseas eliminar este contacto?")) {
      return;
    }

    try {
      const response = await fetch(`/api/portfolio/contacts/${contact.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Error al eliminar contacto");
      }

      router.push("/portfolio/contacts");
      router.refresh();
    } catch (error) {
      console.error("Error deleting contact:", error);
      alert("Error al eliminar contacto");
    }
  };

  const handleOptOutChange = async (channel: "email" | "whatsapp", optedOut: boolean) => {
    try {
      const response = await fetch(`/api/portfolio/contacts/${contact.id}/optout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, optedOut }),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar opt-out");
      }

      const updated = await response.json();
      setCurrentContact(updated);
      router.refresh();
    } catch (error) {
      console.error("Error updating opt-out:", error);
      alert("Error al actualizar opt-out");
    }
  };

  const handleFormSuccess = async () => {
    setFormOpen(false);
    // Refresh contact data
    const response = await fetch(`/api/portfolio/contacts/${contact.id}`);
    if (response.ok) {
      const updated = await response.json();
      setCurrentContact(updated);
    }
    router.refresh();
  };

  return (
    <>
      <ContactDrawer
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open);
          if (!open) {
            router.push("/portfolio/contacts");
          }
        }}
        contact={currentContact}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onOptOutChange={handleOptOutChange}
      />
      {formOpen && (
        <ContactForm
          open={formOpen}
          onOpenChange={setFormOpen}
          companies={companies}
          contact={currentContact}
          onSuccess={handleFormSuccess}
        />
      )}
    </>
  );
}

