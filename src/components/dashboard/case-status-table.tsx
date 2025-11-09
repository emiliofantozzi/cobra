import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import type { CollectionCase } from "@/lib/domain";

type CaseStatusTableProps = {
  cases: CollectionCase[];
};

export function CaseStatusTable({ cases }: CaseStatusTableProps) {
  const getStageBadgeVariant = (stage: string) => {
    switch (stage) {
      case "INITIAL":
        return "secondary";
      case "REMINDER_1":
      case "REMINDER_2":
        return "default";
      case "ESCALATED":
        return "destructive";
      case "PROMISE_TO_PAY":
        return "outline";
      case "RESOLVED":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "default";
      case "PAUSED":
        return "secondary";
      case "CLOSED":
        return "outline";
      default:
        return "outline";
    }
  };

  if (cases.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Casos de cobranza recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No hay casos de cobranza activos.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Casos de cobranza recientes</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Etapa</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Última comunicación</TableHead>
              <TableHead>Próxima acción</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cases.map((caseItem) => (
              <TableRow key={caseItem.id}>
                <TableCell className="font-mono text-xs">
                  {caseItem.id.slice(0, 8)}
                </TableCell>
                <TableCell>
                  <Badge variant={getStageBadgeVariant(caseItem.stage)}>
                    {caseItem.stage}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(caseItem.status)}>
                    {caseItem.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {caseItem.lastCommunicationAt
                    ? new Date(caseItem.lastCommunicationAt).toLocaleDateString("es-ES")
                    : "Nunca"}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {caseItem.nextActionAt
                    ? new Date(caseItem.nextActionAt).toLocaleDateString("es-ES")
                    : "Sin programar"}
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/collections/${caseItem.id}`}>
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

