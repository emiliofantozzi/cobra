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
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Mail, MessageSquare, Phone } from "lucide-react";
import type { InvoiceWithCompany } from "@/lib/types/invoice-extended";
import type { InvoiceId } from "@/lib/domain";
import {
  calculateDaysToDue,
  formatDaysToDue,
  formatNextActionRelative,
  getDerivedTrackingStatus,
} from "@/lib/utils/invoice-calculations";
import { InvoiceInlineDateEdit } from "@/components/invoices/invoice-inline-date-edit";
import { InvoiceBulkActions } from "@/components/invoices/invoice-bulk-actions";
import { InvoiceDrawer } from "@/components/invoices/invoice-drawer";

type InvoiceTableProps = {
  invoices: InvoiceWithCompany[];
};

export function InvoiceTable({ invoices }: InvoiceTableProps) {
  const [selectedIds, setSelectedIds] = useState<InvoiceId[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithCompany | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(invoices.map((inv) => inv.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (invoiceId: InvoiceId, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, invoiceId]);
    } else {
      setSelectedIds(selectedIds.filter((id) => id !== invoiceId));
    }
  };

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

  const getDateOriginBadge = (dateOrigin?: string) => {
    switch (dateOrigin) {
      case "LOADED":
        return <Badge variant="outline" className="text-xs">C</Badge>;
      case "REQUESTED_BY_AGENT":
        return <Badge variant="outline" className="text-xs">S</Badge>;
      case "CONFIRMED_BY_CLIENT":
        return <Badge variant="default" className="text-xs">✓</Badge>;
      default:
        return null;
    }
  };

  const getChannelIcon = (channel?: string) => {
    switch (channel) {
      case "EMAIL":
        return <Mail className="h-4 w-4" />;
      case "WHATSAPP":
        return <MessageSquare className="h-4 w-4" />;
      case "PHONE":
        return <Phone className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <>
      {selectedIds.length > 0 && (
        <InvoiceBulkActions
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />
      )}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedIds.length === invoices.length && invoices.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Empresa</TableHead>
              <TableHead>Número</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Emisión</TableHead>
              <TableHead>Vencimiento</TableHead>
              <TableHead>Fecha esperada</TableHead>
              <TableHead>Promesa</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Días</TableHead>
              <TableHead>Próxima acción</TableHead>
              <TableHead>Último canal</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => {
              const daysToDue = calculateDaysToDue(invoice.dueDate);
              const trackingStatus = getDerivedTrackingStatus(invoice);

              const isSelected = selectedIds.includes(invoice.id);

              return (
                <TableRow key={invoice.id} className={isSelected ? "bg-muted/50" : ""}>
                  <TableCell>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) =>
                        handleSelectOne(invoice.id, checked === true)
                      }
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {invoice.customerCompany ? (
                      <Link
                        href={`/portfolio/companies/${invoice.customerCompany.id}`}
                        className="hover:underline"
                      >
                        {invoice.customerCompany.name}
                      </Link>
                    ) : (
                      invoice.customerCompanyId.slice(0, 8)
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link
                      href={`/portfolio/invoices/${invoice.id}`}
                      className="hover:underline"
                    >
                      {invoice.number || `#${invoice.id.slice(0, 8)}`}
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium">
                    {new Intl.NumberFormat("es-ES", {
                      style: "currency",
                      currency: invoice.currency,
                    }).format(invoice.amount)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(invoice.issueDate).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(invoice.dueDate).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell>
                    <InvoiceInlineDateEdit
                      invoiceId={invoice.id}
                      currentDate={invoice.expectedPaymentDate}
                      currentOrigin={invoice.dateOrigin}
                      nextActionAt={invoice.nextActionAt}
                    />
                  </TableCell>
                  <TableCell>
                    {invoice.paymentPromiseDate ? (
                      <span className="text-sm">
                        {new Date(invoice.paymentPromiseDate).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(invoice.status)}>
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        daysToDue < 0
                          ? "text-destructive font-medium"
                          : daysToDue === 0
                          ? "text-orange-600 font-medium"
                          : "text-muted-foreground"
                      }
                    >
                      {formatDaysToDue(daysToDue)}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatNextActionRelative(invoice.nextActionAt)}
                  </TableCell>
                  <TableCell>
                    {invoice.lastChannel ? (
                      <div className="flex items-center gap-1">
                        {getChannelIcon(invoice.lastChannel)}
                        <span className="text-xs text-muted-foreground">
                          {invoice.lastChannel}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedInvoice(invoice);
                        setDrawerOpen(true);
                      }}
                    >
                      Ver <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
    <InvoiceDrawer
      open={drawerOpen}
      onOpenChange={setDrawerOpen}
      invoice={selectedInvoice}
    />
    </>
  );
}

