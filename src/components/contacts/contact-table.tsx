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
import { ArrowRight, Mail, Phone } from "lucide-react";
import type { Contact } from "@/lib/domain";

type ContactTableProps = {
  contacts: Contact[];
};

export function ContactTable({ contacts }: ContactTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead>Principal</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell className="font-medium">
                  {contact.firstName} {contact.lastName}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {contact.email ? (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      {contact.email}
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
                  {contact.whatsappNumber || "-"}
                </TableCell>
                <TableCell>
                  {contact.isPrimary ? (
                    <Badge variant="secondary">Sí</Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">No</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/contacts/${contact.id}`}>
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

