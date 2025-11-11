"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";
import { CompanyForm } from "./company-form";
import { ArchiveConfirmationDialog } from "./archive-confirmation-dialog";
import type { CustomerCompany } from "@/lib/domain";
import { hasPermission } from "@/lib/utils/permissions";
import type { MembershipRole } from "@prisma/client";
import * as Sentry from "@sentry/nextjs";

type CompanyTableActionsProps = {
  company: CustomerCompany;
  userRole?: MembershipRole;
};

export function CompanyTableActions({ company, userRole }: CompanyTableActionsProps) {
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/portfolio/companies/${company.id}`}>
              Ver detalles
            </Link>
          </DropdownMenuItem>
          {hasPermission(userRole, "companies:update") && (
            <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
              Editar
            </DropdownMenuItem>
          )}
          {hasPermission(userRole, "companies:archive") && (
            company.status === "ARCHIVED" ? (
              <DropdownMenuItem onClick={() => setIsArchiveDialogOpen(true)}>
                Reactivar
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setIsArchiveDialogOpen(true)}
              >
                Archivar
              </DropdownMenuItem>
            )
          )}
        </DropdownMenuContent>
      </DropdownMenu>
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

