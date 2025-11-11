"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Archive, Download, X } from "lucide-react";
import * as Sentry from "@sentry/nextjs";

type BulkActionsToolbarProps = {
  selectedIds: string[];
  onClearSelection: () => void;
};

export function BulkActionsToolbar({ selectedIds, onClearSelection }: BulkActionsToolbarProps) {
  const router = useRouter();
  const [isArchiving, setIsArchiving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleArchive = async () => {
    if (!confirm(`¿Estás seguro de que quieres archivar ${selectedIds.length} empresas?`)) {
      return;
    }

    setIsArchiving(true);
    try {
      const response = await fetch("/api/portfolio/companies/bulk/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al archivar empresas");
      }

      Sentry.startSpan(
        {
          op: "ui.action",
          name: "ui.portfolio.companies.bulk_archived",
        },
        () => {
          Sentry.setContext("bulk_archive", {
            count: selectedIds.length,
            companyIds: selectedIds,
          });
        }
      );

      onClearSelection();
      router.refresh();
    } catch (error) {
      console.error("Error archiving companies:", error);
      alert(error instanceof Error ? error.message : "Error al archivar empresas");
    } finally {
      setIsArchiving(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/portfolio/companies/export");
      if (!response.ok) {
        throw new Error("Error al exportar empresas");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `empresas-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      Sentry.startSpan(
        {
          op: "ui.action",
          name: "ui.portfolio.companies.exported",
        },
        () => {
          Sentry.setContext("companies_export", {
            format: "csv",
            count: selectedIds.length,
          });
        }
      );
    } catch (error) {
      console.error("Error exporting companies:", error);
      alert("Error al exportar empresas");
    } finally {
      setIsExporting(false);
    }
  };

  if (selectedIds.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          {selectedIds.length} {selectedIds.length === 1 ? "empresa seleccionada" : "empresas seleccionadas"}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleArchive}
          loading={isArchiving}
          loadingText="Archivando..."
        >
          <Archive className="mr-2 h-4 w-4" />
          Archivar
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          loading={isExporting}
          loadingText="Exportando..."
        >
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          <X className="mr-2 h-4 w-4" />
          Cancelar
        </Button>
      </div>
    </div>
  );
}

