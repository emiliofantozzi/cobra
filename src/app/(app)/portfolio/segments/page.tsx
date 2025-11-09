import { requireSession } from "@/lib/services/session";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// TODO: Replace with API call in Phase 3
const mockSegments = [
  {
    id: "1",
    name: "Morosos >30 días",
    conditions: ">30 días mora y saldo>$1000",
    invoiceCount: 15,
    active: true,
  },
  {
    id: "2",
    name: "Clientes VIP",
    conditions: "Saldo total >$50000",
    invoiceCount: 8,
    active: true,
  },
];

export default async function SegmentsPage() {
  const session = await requireSession({ redirectTo: "/" });

  if (!session.organization?.id) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Segmentos</h1>
          <p className="text-sm text-muted-foreground">
            Crea segmentos para agrupar facturas y clientes
          </p>
        </div>
        <Button asChild>
          <Link href="/portfolio/segments/new">
            <Plus className="mr-2 h-4 w-4" />
            Crear segmento
          </Link>
        </Button>
      </div>

      {mockSegments.length === 0 ? (
        <EmptyState
          title="No hay segmentos"
          description="Crea tu primer segmento para agrupar facturas y clientes con criterios específicos."
          action={
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Ejemplos de segmentos:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>&gt;30 días mora y saldo&gt;$1000</li>
                <li>Facturas sin fecha esperada</li>
                <li>Clientes con promesas de pago</li>
              </ul>
              <Button asChild className="mt-4">
                <Link href="/portfolio/segments/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear segmento
                </Link>
              </Button>
            </div>
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Condiciones</TableHead>
                  <TableHead>Facturas</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockSegments.map((segment) => (
                  <TableRow key={segment.id}>
                    <TableCell className="font-medium">{segment.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {segment.conditions}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{segment.invoiceCount}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={segment.active ? "default" : "secondary"}>
                        {segment.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

