"use client";

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
import { ArrowRight } from "lucide-react";
import type { CustomerCompany } from "@/lib/domain";

type CustomerTableProps = {
  customers: CustomerCompany[];
};

export function CustomerTable({ customers }: CustomerTableProps) {
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

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Razón social</TableHead>
              <TableHead>Tax ID</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Industria</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-medium">{customer.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {customer.legalName || "-"}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {customer.taxId || "-"}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(customer.status)}>
                    {customer.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {customer.industry || "-"}
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/customers/${customer.id}`}>
                    <Button variant="ghost" size="sm">
                      Ver <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

