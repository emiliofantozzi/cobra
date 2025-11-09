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
import type { Invoice } from "@/lib/domain";

type InvoiceTableProps = {
  invoices: Invoice[];
};

export function InvoiceTable({ invoices }: InvoiceTableProps) {
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "PAID":
        return "default";
      case "PENDING":
        return "secondary";
      case "OVERDUE":
        return "destructive";
      case "PARTIALLY_PAID":
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
              <TableHead>Número</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Fecha vencimiento</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">
                  {invoice.number || `#${invoice.id.slice(0, 8)}`}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {invoice.customerCompanyId.slice(0, 8)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(invoice.dueDate).toLocaleDateString("es-ES")}
                </TableCell>
                <TableCell className="font-medium">
                  {new Intl.NumberFormat("es-ES", {
                    style: "currency",
                    currency: invoice.currency,
                  }).format(invoice.amount)}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(invoice.status)}>
                    {invoice.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/invoices/${invoice.id}`}>
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

