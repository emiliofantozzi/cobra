"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { CustomerCompany } from "@/lib/domain";
import { CompanyTableActions } from "@/components/portfolio/companies/company-table-actions";
import { hasPermission } from "@/lib/utils/permissions";
import type { MembershipRole } from "@prisma/client";

type CustomerTableProps = {
  customers: CustomerCompany[];
  onSelectionChange?: (selectedIds: string[]) => void;
  selectedIds?: string[];
  userRole?: MembershipRole;
};

export function CustomerTable({ customers, onSelectionChange, selectedIds = [], userRole }: CustomerTableProps) {
  const [internalSelected, setInternalSelected] = useState<string[]>(selectedIds);

  const selected = selectedIds.length > 0 ? selectedIds : internalSelected;
  const setSelected = onSelectionChange || setInternalSelected;

  const allSelected = customers.length > 0 && selected.length === customers.length;
  const someSelected = selected.length > 0 && selected.length < customers.length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelected(customers.map((c) => c.id));
    } else {
      setSelected([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelected([...selected, id]);
    } else {
      setSelected(selected.filter((selectedId) => selectedId !== id));
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "default";
      case "INACTIVE":
        return "secondary";
      case "ARCHIVED":
        return "outline";
      default:
        return "outline";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "INACTIVE":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "ARCHIVED":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "";
    }
  };

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              {hasPermission(userRole, "companies:archive") && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Seleccionar todas"
                  />
                </TableHead>
              )}
              <TableHead>Nombre</TableHead>
              <TableHead>Razón social</TableHead>
              <TableHead>Tax ID</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Contactos</TableHead>
              <TableHead>Facturas</TableHead>
              <TableHead>Creada</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow
                key={customer.id}
                className={selected.includes(customer.id) ? "bg-muted/50" : ""}
              >
                {hasPermission(userRole, "companies:archive") && (
                  <TableCell>
                    <Checkbox
                      checked={selected.includes(customer.id)}
                      onCheckedChange={(checked) =>
                        handleSelectOne(customer.id, checked as boolean)
                      }
                      aria-label={`Seleccionar ${customer.name}`}
                    />
                  </TableCell>
                )}
                <TableCell className="font-medium">
                  <Link
                    href={`/portfolio/companies/${customer.id}`}
                    className="hover:underline"
                  >
                    {customer.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {customer.legalName || "-"}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {customer.taxId || "-"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={getStatusBadgeVariant(customer.status)}
                    className={getStatusBadgeColor(customer.status)}
                  >
                    {customer.status === "ACTIVE" && "Activa"}
                    {customer.status === "INACTIVE" && "Inactiva"}
                    {customer.status === "ARCHIVED" && "Archivada"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {(customer as any).contactsCount !== undefined
                    ? `${(customer as any).contactsCount} ${(customer as any).contactsCount === 1 ? "contacto" : "contactos"}`
                    : "-"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {(customer as any).invoicesCount !== undefined
                    ? `${(customer as any).invoicesCount} ${(customer as any).invoicesCount === 1 ? "factura" : "facturas"}`
                    : "-"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDistanceToNow(customer.createdAt, {
                    addSuffix: true,
                    locale: es,
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <CompanyTableActions company={customer} userRole={userRole} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

