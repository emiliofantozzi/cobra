"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CustomerTable } from "@/components/customers/customer-table";
import { EmptyState } from "@/components/shared/empty-state";
import { BulkActionsToolbar } from "./bulk-actions-toolbar";
import { TableSkeleton } from "@/components/shared/skeletons";
import { Plus, Upload } from "lucide-react";
import Link from "next/link";
import type { CustomerCompany } from "@/lib/domain";
import { hasPermission } from "@/lib/utils/permissions";
import type { MembershipRole } from "@prisma/client";

type CompaniesListProps = {
  initialData: (CustomerCompany & { contactsCount: number; invoicesCount: number })[];
  initialTotalCount?: number;
  initialCursor?: string | null;
  userRole?: MembershipRole;
};

export function CompaniesList({ initialData, initialTotalCount = 0, initialCursor, userRole }: CompaniesListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [status, setStatus] = useState<string>(searchParams.get("status") || "all");
  const [sortBy, setSortBy] = useState<string>(searchParams.get("sortBy") || "createdAt");
  const [sortDirection, setSortDirection] = useState<string>(searchParams.get("sortDirection") || "desc");
  const [limit, setLimit] = useState<number>(parseInt(searchParams.get("limit") || "25", 10));
  const [companies, setCompanies] = useState<CustomerCompany[]>(initialData);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [cursor, setCursor] = useState<string | null>(initialCursor || null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      updateFilters();
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const updateFilters = () => {
    startTransition(() => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (status !== "all") params.set("status", status);
      if (sortBy !== "createdAt") params.set("sortBy", sortBy);
      if (sortDirection !== "desc") params.set("sortDirection", sortDirection);
      if (limit !== 25) params.set("limit", limit.toString());
      if (cursor) params.set("cursor", cursor);

      router.push(`/portfolio/companies?${params.toString()}`);
      router.refresh();
    });
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    setCursor(null);
    startTransition(() => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (value !== "all") params.set("status", value);
      if (sortBy !== "createdAt") params.set("sortBy", sortBy);
      if (sortDirection !== "desc") params.set("sortDirection", sortDirection);
      if (limit !== 25) params.set("limit", limit.toString());

      router.push(`/portfolio/companies?${params.toString()}`);
      router.refresh();
    });
  };

  const handleSortChange = (value: string) => {
    const [newSortBy, newSortDirection] = value.split("-");
    setSortBy(newSortBy);
    setSortDirection(newSortDirection);
    setCursor(null);
    startTransition(() => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (status !== "all") params.set("status", status);
      params.set("sortBy", newSortBy);
      params.set("sortDirection", newSortDirection);
      if (limit !== 25) params.set("limit", limit.toString());

      router.push(`/portfolio/companies?${params.toString()}`);
      router.refresh();
    });
  };

  const handleLimitChange = (value: string) => {
    const newLimit = parseInt(value, 10);
    setLimit(newLimit);
    setCursor(null);
    startTransition(() => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (status !== "all") params.set("status", status);
      if (sortBy !== "createdAt") params.set("sortBy", sortBy);
      if (sortDirection !== "desc") params.set("sortDirection", sortDirection);
      params.set("limit", newLimit.toString());

      router.push(`/portfolio/companies?${params.toString()}`);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <Input
            placeholder="Buscar por nombre, razón social o RUT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="ACTIVE">Activas</SelectItem>
              <SelectItem value="INACTIVE">Inactivas</SelectItem>
              <SelectItem value="ARCHIVED">Archivadas</SelectItem>
            </SelectContent>
          </Select>
          <Select value={`${sortBy}-${sortDirection}`} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Nombre A-Z</SelectItem>
              <SelectItem value="name-desc">Nombre Z-A</SelectItem>
              <SelectItem value="createdAt-desc">Más recientes</SelectItem>
              <SelectItem value="createdAt-asc">Más antiguas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      {isPending ? (
        <TableSkeleton rows={5} columns={5} />
      ) : companies.length === 0 ? (
        <EmptyState
          title="No hay empresas"
          description="Importa tu primera hoja o crea una empresa manualmente."
          action={
            hasPermission(userRole, "companies:create") ? (
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <Link href="/settings/data">
                    <Upload className="mr-2 h-4 w-4" />
                    Importar CSV
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/portfolio/companies/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Crear empresa
                  </Link>
                </Button>
              </div>
            ) : undefined
          }
        />
      ) : (
        <>
          {hasPermission(userRole, "companies:archive") && (
            <BulkActionsToolbar
              selectedIds={selectedIds}
              onClearSelection={() => setSelectedIds([])}
            />
          )}
          <CustomerTable
            customers={companies}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            userRole={userRole}
          />
          {/* Pagination */}
          {totalCount > limit && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Mostrando {companies.length} de {totalCount} empresas
              </div>
              <div className="flex items-center gap-2">
                <Select value={limit.toString()} onValueChange={handleLimitChange}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">por página</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

