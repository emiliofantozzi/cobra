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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Phone, MessageSquare, MoreVertical, ArrowRight } from "lucide-react";
import { hasPermission } from "@/lib/utils/permissions";
import type { Contact } from "@/lib/domain";
import type { MembershipRole } from "@prisma/client";
import Link from "next/link";

type ContactTableProps = {
  contacts: Contact[];
  onContactClick?: (contact: Contact) => void;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
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

const getEmailStatusIcon = (status: string) => {
  switch (status) {
    case "DELIVERABLE":
      return "✓";
    case "BOUNCE":
      return "⚠";
    default:
      return "?";
  }
};

const getWhatsAppStatusIcon = (status: string) => {
  switch (status) {
    case "VALIDATED":
      return "✓";
    case "BLOCKED":
      return "⊗";
    default:
      return "?";
  }
};

export function ContactTable({
  contacts,
  onContactClick,
  selectedIds = [],
  onSelectionChange,
  userRole,
}: ContactTableProps) {
  const handleSelectAll = (checked: boolean) => {
    if (onSelectionChange) {
      onSelectionChange(checked ? contacts.map((c) => c.id) : []);
    }
  };

  const handleSelectOne = (contactId: string, checked: boolean) => {
    if (onSelectionChange) {
      if (checked) {
        onSelectionChange([...selectedIds, contactId]);
      } else {
        onSelectionChange(selectedIds.filter((id) => id !== contactId));
      }
    }
  };

  const allSelected = contacts.length > 0 && selectedIds.length === contacts.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < contacts.length;

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              {onSelectionChange && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Seleccionar todos"
                  />
                </TableHead>
              )}
              <TableHead>Nombre</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead>Canal Preferido</TableHead>
              <TableHead>Idioma</TableHead>
              <TableHead>Opt-out</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.map((contact) => (
              <TableRow
                key={contact.id}
                className="cursor-pointer"
                onClick={() => onContactClick?.(contact)}
              >
                {onSelectionChange && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.includes(contact.id)}
                      onCheckedChange={(checked) =>
                        handleSelectOne(contact.id, checked === true)
                      }
                      aria-label={`Seleccionar ${contact.firstName} ${contact.lastName}`}
                    />
                  </TableCell>
                )}
                <TableCell className="font-medium">
                  {contact.firstName} {contact.lastName}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/portfolio/companies/${contact.customerCompanyId}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-blue-600 hover:underline"
                  >
                    Ver empresa
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{getRoleLabel(contact.role)}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {contact.email ? (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      <span>{contact.email}</span>
                      <span className="text-xs">{getEmailStatusIcon(contact.emailStatus)}</span>
                    </div>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {contact.phoneNumber ? (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      {contact.phoneNumber}
                    </div>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {contact.whatsappNumber ? (
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-3 w-3" />
                      <span>{contact.whatsappNumber}</span>
                      <span className="text-xs">{getWhatsAppStatusIcon(contact.whatsappStatus)}</span>
                    </div>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{getChannelLabel(contact.preferredChannel)}</Badge>
                </TableCell>
                <TableCell>{contact.language?.toUpperCase() || "-"}</TableCell>
                <TableCell>
                  {(contact.optedOutEmail || contact.optedOutWhatsapp) && (
                    <Badge variant="destructive">Opt-out</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onContactClick?.(contact)}>
                        Ver detalle
                      </DropdownMenuItem>
                      {hasPermission(userRole, "contacts:update") && (
                        <DropdownMenuItem asChild>
                          <Link href={`/portfolio/contacts/${contact.id}/edit`}>Editar</Link>
                        </DropdownMenuItem>
                      )}
                      {hasPermission(userRole, "contacts:delete") && (
                        <DropdownMenuItem className="text-destructive">Eliminar</DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

