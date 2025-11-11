"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CustomerOverview } from "@/components/customers/customer-overview";
import { CompanyForm } from "./company-form";
import { ArchiveConfirmationDialog } from "./archive-confirmation-dialog";
import { hasPermission } from "@/lib/utils/permissions";
import type { CustomerCompany } from "@/lib/domain";
import type { MembershipRole } from "@prisma/client";
import * as Sentry from "@sentry/nextjs";

type CompanyDetailClientProps = {
  company: CustomerCompany & {
    contactsCount?: number;
    invoicesCount?: number;
    totalPendingAmount?: number;
  };
  userRole?: MembershipRole;
};

export function CompanyDetailClient({ company, userRole }: CompanyDetailClientProps) {
  const router = useRouter();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  const handleArchive = async () => {
    setIsArchiving(true);
    try {
      const url = company.status === "ARCHIVED"
        ? `/api/portfolio/companies/${company.id}/reactivate`
        : `/api/portfolio/companies/${company.id}/archive`;

      const response = await fetch(url, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al archivar/reactivar empresa");
      }

      Sentry.startSpan(
        {
          op: "ui.action",
          name: company.status === "ARCHIVED"
            ? "ui.portfolio.companies.reactivated"
            : "ui.portfolio.companies.archived",
        },
        () => {
          Sentry.setContext("company_archive", {
            companyId: company.id,
            name: company.name,
          });
        }
      );

      setIsArchiveDialogOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Error archiving company:", error);
      alert(error instanceof Error ? error.message : "Error al archivar empresa");
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <>
      <CustomerOverview
        customer={company}
        onEdit={hasPermission(userRole, "companies:update") ? () => setIsEditOpen(true) : undefined}
      />
      <CompanyForm
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        company={company}
        onSuccess={() => router.refresh()}
      />
      <ArchiveConfirmationDialog
        open={isArchiveDialogOpen}
        onOpenChange={setIsArchiveDialogOpen}
        companyName={company.name}
        isArchived={company.status === "ARCHIVED"}
        onConfirm={handleArchive}
      />
    </>
  );
}

