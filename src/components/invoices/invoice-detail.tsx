import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Invoice } from "@/lib/domain";

type InvoiceDetailProps = {
  invoice: Invoice;
};

export function InvoiceDetail({ invoice }: InvoiceDetailProps) {
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
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            {invoice.number || `Factura #${invoice.id.slice(0, 8)}`}
          </CardTitle>
          <Badge variant={getStatusBadgeVariant(invoice.status)}>
            {invoice.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Fecha de emisión
            </p>
            <p className="text-sm">
              {new Date(invoice.issueDate).toLocaleDateString("es-ES")}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Fecha de vencimiento
            </p>
            <p className="text-sm">
              {new Date(invoice.dueDate).toLocaleDateString("es-ES")}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Monto</p>
            <p className="text-lg font-semibold">
              {new Intl.NumberFormat("es-ES", {
                style: "currency",
                currency: invoice.currency,
              }).format(invoice.amount)}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Moneda</p>
            <p className="text-sm">{invoice.currency}</p>
          </div>
        </div>
        {invoice.description && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Descripción
            </p>
            <p className="text-sm whitespace-pre-wrap">{invoice.description}</p>
          </div>
        )}
        {invoice.notes && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">Notas</p>
            <p className="text-sm whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

