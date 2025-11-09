import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, ArrowRight } from "lucide-react";
import type { Invoice } from "@/lib/domain";

type InvoicesListProps = {
  invoices: Invoice[];
  customerId: string;
};

export function InvoicesList({ invoices, customerId }: InvoicesListProps) {
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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Facturas</CardTitle>
        <Link href={`/invoices/new?customerId=${customerId}`}>
          <Button variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Nueva
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay facturas registradas.
          </p>
        ) : (
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between rounded-lg border border-border p-3"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      {invoice.number || `Factura #${invoice.id.slice(0, 8)}`}
                    </p>
                    <Badge variant={getStatusBadgeVariant(invoice.status)}>
                      {invoice.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(invoice.dueDate).toLocaleDateString("es-ES")} -{" "}
                    {new Intl.NumberFormat("es-ES", {
                      style: "currency",
                      currency: invoice.currency,
                    }).format(invoice.amount)}
                  </p>
                </div>
                <Link href={`/invoices/${invoice.id}`}>
                  <Button variant="ghost" size="sm">
                    <ArrowRight className="h-4 w-4" />
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

