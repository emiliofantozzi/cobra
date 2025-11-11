import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, ExternalLink } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { CustomerCompany } from "@/lib/domain";

type CustomerOverviewProps = {
  customer: CustomerCompany & {
    contactsCount?: number;
    invoicesCount?: number;
    totalPendingAmount?: number;
  };
  onEdit?: () => void;
};

export function CustomerOverview({ customer, onEdit }: CustomerOverviewProps) {
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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "Activa";
      case "INACTIVE":
        return "Inactiva";
      case "ARCHIVED":
        return "Archivada";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Información General</CardTitle>
            {onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Nombre</p>
            <p className="text-sm font-semibold">{customer.name}</p>
          </div>
          {customer.legalName && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Razón social
              </p>
              <p className="text-sm">{customer.legalName}</p>
            </div>
          )}
          {customer.taxId && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">RUT / Tax ID</p>
              <p className="font-mono text-sm">{customer.taxId}</p>
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-muted-foreground">Estado</p>
            <Badge variant={getStatusBadgeVariant(customer.status)}>
              {getStatusLabel(customer.status)}
            </Badge>
          </div>
          {customer.industry && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Industria
              </p>
              <p className="text-sm">{customer.industry}</p>
            </div>
          )}
          {customer.website && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Sitio web</p>
              <a
                href={customer.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
              >
                {customer.website}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
          {customer.notes && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Notas internas</p>
              <p className="text-sm whitespace-pre-wrap">{customer.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Metadatos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Creada</p>
            <p className="text-sm">
              {format(customer.createdAt, "d 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Última actualización</p>
            <p className="text-sm">
              {format(customer.updatedAt, "d 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
          </div>
          {customer.contactsCount !== undefined && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Contactos</p>
              <Link href="#contacts" className="text-sm text-primary hover:underline">
                {customer.contactsCount} {customer.contactsCount === 1 ? "contacto" : "contactos"}
              </Link>
            </div>
          )}
          {customer.invoicesCount !== undefined && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Facturas</p>
              <Link href="#invoices" className="text-sm text-primary hover:underline">
                {customer.invoicesCount} {customer.invoicesCount === 1 ? "factura" : "facturas"}
                {customer.totalPendingAmount !== undefined && customer.totalPendingAmount > 0 && (
                  <span className="text-muted-foreground ml-2">
                    • Pendiente: ${customer.totalPendingAmount.toLocaleString()}
                  </span>
                )}
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

