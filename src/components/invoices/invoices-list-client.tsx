"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { InvoiceTable } from "@/components/invoices/invoice-table";
import { InvoiceFilterChips } from "@/components/invoices/invoice-filter-chips";
import { InvoiceSearch } from "@/components/invoices/invoice-search";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/skeletons";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import type { InvoiceWithCompany } from "@/lib/types/invoice-extended";

type InvoicesListClientProps = {
  initialInvoices: InvoiceWithCompany[];
  initialChipCounts: {
    sin_fecha: number;
    con_fecha: number;
    vence_hoy: number;
    vencidas: number;
    con_promesa_hoy: number;
    promesa_incumplida: number;
    disputa: number;
    pagadas: number;
  };
};

export function InvoicesListClient({
  initialInvoices,
  initialChipCounts,
}: InvoicesListClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [invoices, setInvoices] = useState<InvoiceWithCompany[]>(initialInvoices);
  const [isLoading, setIsLoading] = useState(false);
  const [chipCounts, setChipCounts] = useState(initialChipCounts);

  const search = searchParams.get("search");
  const chip = searchParams.get("chip");

  useEffect(() => {
    const fetchInvoices = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (chip) params.set("chip", chip);

        const response = await fetch(`/api/portfolio/invoices?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setInvoices(data.data || []);
        }
      } catch (error) {
        console.error("Error fetching invoices:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Only refetch if search or chip changed
    if (search !== null || chip !== null) {
      fetchInvoices();
    }
  }, [search, chip]);

  // Refresh chip counts periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch("/api/portfolio/invoices/chips");
        if (response.ok) {
          const counts = await response.json();
          setChipCounts(counts);
        }
      } catch (error) {
        console.error("Error refreshing chip counts:", error);
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return <TableSkeleton rows={5} columns={8} />;
  }

  if (invoices.length === 0) {
    return (
      <EmptyState
        title={search || chip ? "No se encontraron facturas" : "No hay facturas"}
        description={
          search || chip
            ? "Intenta ajustar los filtros de búsqueda"
            : "Comienza agregando tu primera factura o importa desde CSV."
        }
        action={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/settings/data">Importar CSV</Link>
            </Button>
            <Button asChild>
              <Link href="/portfolio/invoices/new">
                <Plus className="mr-2 h-4 w-4" />
                Agregar factura
              </Link>
            </Button>
          </div>
        }
      />
    );
  }

  return <InvoiceTable invoices={invoices} />;
}

