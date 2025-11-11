"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ContactForm } from "./contact-form";
import type { CustomerCompany, Contact } from "@/lib/domain";

type ContactFormClientProps = {
  companies: CustomerCompany[];
  contact?: Contact;
};

export function ContactFormClient({ companies, contact }: ContactFormClientProps) {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  const handleSuccess = () => {
    router.push("/portfolio/contacts");
    router.refresh();
  };

  return (
    <ContactForm
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          router.push("/portfolio/contacts");
        }
      }}
      companies={companies}
      contact={contact}
      onSuccess={handleSuccess}
    />
  );
}

