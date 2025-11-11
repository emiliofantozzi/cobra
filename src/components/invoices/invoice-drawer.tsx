"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Edit, ExternalLink, Calendar, Mail, MessageSquare, Phone } from "lucide-react";
import Link from "next/link";
import { hasPermission } from "@/lib/utils/permissions";
import type { InvoiceWithCompany } from "@/lib/types/invoice-extended";
import type { MembershipRole } from "@prisma/client";
import {
  calculateDaysToDue,
  formatDaysToDue,
  formatNextActionRelative,
  getDerivedTrackingStatus,
} from "@/lib/utils/invoice-calculations";
import { InvoiceMarkPaidDialog } from "@/components/invoices/invoice-mark-paid-dialog";
import { InvoiceCancelDialog } from "@/components/invoices/invoice-cancel-dialog";
import { InvoiceInlineDateEdit } from "@/components/invoices/invoice-inline-date-edit";

type InvoiceDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: InvoiceWithCompany | null;
  onEdit?: () => void;
  userRole?: MembershipRole;
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
    case "CANCELLED":
      return "outline";
    default:
      return "outline";
  }
};

const getDateOriginLabel = (origin?: string) => {
  switch (origin) {
    case "LOADED":
      return "Cargada (al importar)";
    case "REQUESTED_BY_AGENT":
      return "Solicitada por agente";
    case "CONFIRMED_BY_CLIENT":
      return "Confirmada por cliente";
    default:
      return "-";
  }
};

const getChannelLabel = (channel?: string) => {
  switch (channel) {
    case "EMAIL":
      return "Email";
    case "WHATSAPP":
      return "WhatsApp";
    case "SMS":
      return "SMS";
    case "PHONE":
      return "Teléfono";
    default:
      return "-";
  }
};

export function InvoiceDrawer({
  open,
  onOpenChange,
  invoice,
  onEdit,
  userRole,
}: InvoiceDrawerProps) {
  if (!invoice) return null;

  const daysToDue = calculateDaysToDue(invoice.dueDate);
  const trackingStatus = getDerivedTrackingStatus(invoice);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <SheetTitle className="text-2xl">
                {invoice.number || `Factura #${invoice.id.slice(0, 8)}`}
              </SheetTitle>
              <SheetDescription className="mt-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={getStatusBadgeVariant(invoice.status)}>
                    {invoice.status}
                  </Badge>
                  {invoice.customerCompany && (
                    <Link
                      href={`/portfolio/companies/${invoice.customerCompany.id}`}
                      className="hover:underline"
                    >
                      <Badge variant="outline" className="gap-1">
                        {invoice.customerCompany.name}
                        <ExternalLink className="h-3 w-3" />
                      </Badge>
                    </Link>
                  )}
                </div>
                {invoice.description && (
                  <p className="mt-2 text-sm text-muted-foreground">{invoice.description}</p>
                )}
              </SheetDescription>
            </div>
            <div className="flex items-center gap-2">
              {onEdit && hasPermission(userRole, "invoices:update") && (
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              )}
            </div>
          </div>
        </SheetHeader>

        <Tabs defaultValue="data" className="mt-6">
          <TabsList>
            <TabsTrigger value="data">Datos</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="history">Historial</TabsTrigger>
          </TabsList>

          <TabsContent value="data" className="space-y-6 mt-4">
            {/* Información básica */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Información básica</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Empresa</span>
                  {invoice.customerCompany ? (
                    <Link
                      href={`/portfolio/companies/${invoice.customerCompany.id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {invoice.customerCompany.name}
                    </Link>
                  ) : (
                    <span className="text-sm font-medium">
                      {invoice.customerCompanyId.slice(0, 8)}
                    </span>
                  )}
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Número</span>
                  <span className="text-sm font-medium">{invoice.number || "-"}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Monto</span>
                  <span className="text-sm font-medium">
                    {new Intl.NumberFormat("es-ES", {
                      style: "currency",
                      currency: invoice.currency,
                    }).format(invoice.amount)}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Fecha de emisión</span>
                  <span className="text-sm font-medium">
                    {new Date(invoice.issueDate).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Fecha de vencimiento</span>
                  <span className="text-sm font-medium">
                    {new Date(invoice.dueDate).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Días hasta vencimiento</span>
                  <span
                    className={`text-sm font-medium ${
                      daysToDue < 0
                        ? "text-destructive"
                        : daysToDue === 0
                        ? "text-orange-600"
                        : ""
                    }`}
                  >
                    {formatDaysToDue(daysToDue)}
                  </span>
                </div>
              </div>
            </div>

            {/* Seguimiento */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Seguimiento</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Fecha esperada de pago</span>
                  <InvoiceInlineDateEdit
                    invoiceId={invoice.id}
                    currentDate={invoice.expectedPaymentDate}
                    currentOrigin={invoice.dateOrigin}
                    nextActionAt={invoice.nextActionAt}
                  />
                </div>
                <Separator />
                {invoice.dateOrigin && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Origen de fecha</span>
                      <span className="text-sm font-medium">
                        {getDateOriginLabel(invoice.dateOrigin)}
                      </span>
                    </div>
                    <Separator />
                  </>
                )}
                {invoice.paymentPromiseDate && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Promesa de pago</span>
                      <span className="text-sm font-medium">
                        {new Date(invoice.paymentPromiseDate).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <Separator />
                  </>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Próxima acción</span>
                  <span className="text-sm font-medium">
                    {formatNextActionRelative(invoice.nextActionAt)}
                  </span>
                </div>
                <Separator />
                {invoice.lastChannel && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Último canal</span>
                      <div className="flex items-center gap-2">
                        {invoice.lastChannel === "EMAIL" && <Mail className="h-4 w-4" />}
                        {invoice.lastChannel === "WHATSAPP" && (
                          <MessageSquare className="h-4 w-4" />
                        )}
                        {invoice.lastChannel === "PHONE" && <Phone className="h-4 w-4" />}
                        <span className="text-sm font-medium">
                          {getChannelLabel(invoice.lastChannel)}
                        </span>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}
                {invoice.lastResult && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Último resultado</span>
                      <span className="text-sm font-medium">{invoice.lastResult}</span>
                    </div>
                    <Separator />
                  </>
                )}
              </div>
            </div>

            {/* Notas */}
            {invoice.notes && (
              <div>
                <h3 className="text-sm font-semibold mb-3">Notas</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {invoice.notes}
                </p>
              </div>
            )}

            {/* Acciones */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Acciones</h3>
              <div className="flex flex-wrap gap-2">
                {invoice.status !== "PAID" &&
                  invoice.status !== "CANCELLED" &&
                  hasPermission(userRole, "invoices:mark_paid") && (
                    <InvoiceMarkPaidDialog
                      invoiceId={invoice.id}
                      invoiceNumber={invoice.number}
                      amount={invoice.amount}
                      currency={invoice.currency}
                    />
                  )}
                {invoice.status !== "CANCELLED" &&
                  hasPermission(userRole, "invoices:cancel") && (
                    <InvoiceCancelDialog
                      invoiceId={invoice.id}
                      invoiceNumber={invoice.number}
                    />
                  )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-4 mt-4">
            <div className="text-sm text-muted-foreground">
              Timeline de interacciones y cambios de estado
              <br />
              <span className="text-xs">(Próximamente: integración con CommunicationAttempt y AgentActionLog)</span>
            </div>
            {/* TODO: Implementar timeline con CommunicationAttempt y AgentActionLog */}
          </TabsContent>

          <TabsContent value="history" className="space-y-4 mt-4">
            <div className="text-sm text-muted-foreground">
              Historial de cambios en fecha esperada de pago
              <br />
              <span className="text-xs">(Próximamente: mostrar InvoiceDateHistory)</span>
            </div>
            {/* TODO: Implementar tabla de InvoiceDateHistory */}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

