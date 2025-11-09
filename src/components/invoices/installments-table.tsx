import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

type InstallmentsTableProps = {
  installments: any[];
  invoiceId: string;
};

export function InstallmentsTable({
  installments,
  invoiceId,
}: InstallmentsTableProps) {
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "PAID":
        return "default";
      case "PENDING":
        return "secondary";
      case "OVERDUE":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Cuotas</CardTitle>
        <Button variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Agregar cuota
        </Button>
      </CardHeader>
      <CardContent>
        {installments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay cuotas registradas para esta factura.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Secuencia</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Pagado</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {installments.map((installment) => (
                <TableRow key={installment.id}>
                  <TableCell>{installment.sequence}</TableCell>
                  <TableCell>
                    {new Date(installment.dueDate).toLocaleDateString("es-ES")}
                  </TableCell>
                  <TableCell>
                    {new Intl.NumberFormat("es-ES", {
                      style: "currency",
                      currency: installment.currency || "USD",
                    }).format(installment.amount)}
                  </TableCell>
                  <TableCell>
                    {new Intl.NumberFormat("es-ES", {
                      style: "currency",
                      currency: installment.currency || "USD",
                    }).format(installment.paidAmount || 0)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(installment.status)}>
                      {installment.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

