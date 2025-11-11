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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Mail, Phone, MessageSquare, Edit, Trash2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { hasPermission } from "@/lib/utils/permissions";
import type { Contact } from "@/lib/domain";
import type { MembershipRole } from "@prisma/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type ContactDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact | null;
  onEdit?: () => void;
  onDelete?: () => void;
  onOptOutChange?: (channel: "email" | "whatsapp", optedOut: boolean) => void;
  userRole?: MembershipRole;
};

const getRoleLabel = (role?: string) => {
  switch (role) {
    case "BILLING_AP":
      return "Billing/AP";
    case "OPERATIONS":
      return "Operaciones";
    case "DECISION_MAKER":
      return "Decisor";
    case "OTHER":
      return "Otro";
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

const getEmailStatusBadge = (status: string) => {
  switch (status) {
    case "DELIVERABLE":
      return <Badge variant="default">✓ Entregable</Badge>;
    case "BOUNCE":
      return <Badge variant="destructive">⚠ Bounce</Badge>;
    default:
      return <Badge variant="secondary">? Desconocido</Badge>;
  }
};

const getWhatsAppStatusBadge = (status: string) => {
  switch (status) {
    case "VALIDATED":
      return <Badge variant="default">✓ Validado</Badge>;
    case "BLOCKED":
      return <Badge variant="destructive">⊗ Bloqueado</Badge>;
    default:
      return <Badge variant="secondary">? No validado</Badge>;
  }
};

export function ContactDrawer({
  open,
  onOpenChange,
  contact,
  onEdit,
  onDelete,
  onOptOutChange,
  userRole,
}: ContactDrawerProps) {
  if (!contact) return null;

  const handleOptOutToggle = (channel: "email" | "whatsapp", checked: boolean) => {
    onOptOutChange?.(channel, checked);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto break-words">
        <SheetHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <SheetTitle className="text-2xl">
                {contact.firstName} {contact.lastName}
              </SheetTitle>
              <SheetDescription className="mt-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {contact.role && <Badge variant="secondary">{getRoleLabel(contact.role)}</Badge>}
                  {contact.isPrimary && <Badge>Contacto primario</Badge>}
                  {contact.isBillingContact && <Badge variant="outline">Facturación</Badge>}
                </div>
                {contact.position && (
                  <p className="mt-2 text-sm text-muted-foreground">{contact.position}</p>
                )}
              </SheetDescription>
            </div>
            <div className="flex items-center gap-2">
              {onEdit && hasPermission(userRole, "contacts:update") && (
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
            <TabsTrigger value="activity">Actividad</TabsTrigger>
            <TabsTrigger value="preferences">Preferencias</TabsTrigger>
          </TabsList>

          <TabsContent value="data" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-2">Información de contacto</h3>
                <div className="space-y-2">
                  {contact.email && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 break-all">
                      <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="break-words">{contact.email}</span>
                    </div>
                    {getEmailStatusBadge(contact.emailStatus)}
                  </div>
                  )}
                  {contact.phoneNumber && (
                    <div className="flex items-center gap-2 break-all">
                      <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="break-words">{contact.phoneNumber}</span>
                    </div>
                  )}
                  {contact.whatsappNumber && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 break-all">
                        <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="break-words">{contact.whatsappNumber}</span>
                      </div>
                      {getWhatsAppStatusBadge(contact.whatsappStatus)}
                    </div>
                  )}
                </div>
              </div>

              {contact.preferredChannel && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Canal preferido</h3>
                  <Badge>{getChannelLabel(contact.preferredChannel)}</Badge>
                </div>
              )}

              <Separator />

              <div>
                <h3 className="text-sm font-semibold mb-2">Empresa</h3>
                <Link
                  href={`/portfolio/companies/${contact.customerCompanyId}`}
                  className="text-blue-600 hover:underline flex items-center gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenChange(false);
                  }}
                >
                  Ver empresa <ExternalLink className="h-3 w-3" />
                </Link>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-semibold mb-2">Opt-out y consentimientos</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="optout-email">Email</Label>
                      {contact.optedOutEmailAt && (
                        <p className="text-xs text-muted-foreground">
                          Activo desde: {format(new Date(contact.optedOutEmailAt), "PP", { locale: es })}
                        </p>
                      )}
                    </div>
                    <Switch
                      id="optout-email"
                      checked={contact.optedOutEmail}
                      onCheckedChange={(checked) => handleOptOutToggle("email", checked)}
                      disabled={!hasPermission(userRole, "contacts:manage_optout")}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="optout-whatsapp">WhatsApp</Label>
                      {contact.optedOutWhatsappAt && (
                        <p className="text-xs text-muted-foreground">
                          Activo desde: {format(new Date(contact.optedOutWhatsappAt), "PP", { locale: es })}
                        </p>
                      )}
                    </div>
                    <Switch
                      id="optout-whatsapp"
                      checked={contact.optedOutWhatsapp}
                      onCheckedChange={(checked) => handleOptOutToggle("whatsapp", checked)}
                      disabled={!hasPermission(userRole, "contacts:manage_optout")}
                    />
                  </div>
                </div>
              </div>

              {contact.notes && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-semibold mb-2">Notas internas</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{contact.notes}</p>
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4 mt-4">
            <div className="text-center py-8 text-muted-foreground">
              <p>Comunicaciones recientes</p>
              <p className="text-sm mt-2">(Próximamente)</p>
              <p className="text-xs mt-1">
                El timeline mostrará todas las comunicaciones relacionadas con este contacto.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-2">Idioma preferido</h3>
                <p className="text-sm">{contact.language?.toUpperCase() || "No especificado"}</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2">Zona horaria</h3>
                <p className="text-sm">{contact.timezone || "No especificada"}</p>
              </div>

              {contact.workingHoursWindow && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Ventanas horarias</h3>
                  <p className="text-sm">
                    {contact.workingHoursWindow.start} - {contact.workingHoursWindow.end}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Días: {contact.workingHoursWindow.days.join(", ")}
                  </p>
                </div>
              )}

              <Separator />

              <div>
                <h3 className="text-sm font-semibold mb-2">Metadata</h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>
                    Creado: {format(new Date(contact.createdAt), "PP 'a las' p", { locale: es })}
                  </p>
                  <p>
                    Última actualización: {format(new Date(contact.updatedAt), "PP 'a las' p", { locale: es })}
                  </p>
                </div>
              </div>

              {onDelete && hasPermission(userRole, "contacts:delete") && (
                <>
                  <Separator />
                  <Button variant="destructive" onClick={onDelete} className="w-full">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar contacto
                  </Button>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

