import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Mail, Phone } from "lucide-react";
import type { Contact } from "@/lib/domain";

type ContactsListProps = {
  contacts: Contact[];
  customerId: string;
};

export function ContactsList({ contacts, customerId }: ContactsListProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Contactos</CardTitle>
        <Link href={`/contacts/new?customerId=${customerId}`}>
          <Button variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Agregar
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {contacts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay contactos registrados.
          </p>
        ) : (
          <div className="space-y-4">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-start justify-between rounded-lg border border-border p-3"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      {contact.firstName} {contact.lastName}
                    </p>
                    {contact.isPrimary && (
                      <Badge variant="secondary" className="text-xs">
                        Principal
                      </Badge>
                    )}
                  </div>
                  {contact.position && (
                    <p className="text-sm text-muted-foreground">
                      {contact.position}
                    </p>
                  )}
                  <div className="mt-2 flex flex-col gap-1 text-sm text-muted-foreground">
                    {contact.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        {contact.email}
                      </div>
                    )}
                    {contact.phoneNumber && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        {contact.phoneNumber}
                      </div>
                    )}
                  </div>
                </div>
                <Link href={`/contacts/${contact.id}`}>
                  <Button variant="ghost" size="sm">
                    Ver
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

