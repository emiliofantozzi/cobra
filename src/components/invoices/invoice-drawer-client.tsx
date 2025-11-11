"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { InvoiceDrawer } from "@/components/invoices/invoice-drawer";
import type { InvoiceWithCompany } from "@/lib/types/invoice-extended";
import type { MembershipRole } from "@prisma/client";

type InvoiceDrawerClientProps = {
  invoice: InvoiceWithCompany;
  userRole?: MembershipRole;
};

export function InvoiceDrawerClient({ invoice, userRole }: InvoiceDrawerClientProps) {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    setOpen(true);
  }, [invoice.id]);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      router.push("/portfolio/invoices");
    }
  };

  return (
    <InvoiceDrawer
      open={open}
      onOpenChange={handleOpenChange}
      invoice={invoice}
      userRole={userRole}
    />
  );
}

