"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CompanyForm } from "./company-form";

export function CompanyFormClient() {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  return (
    <CompanyForm
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          router.push("/portfolio/companies");
        }
      }}
      onSuccess={() => {
        router.push("/portfolio/companies");
      }}
    />
  );
}

