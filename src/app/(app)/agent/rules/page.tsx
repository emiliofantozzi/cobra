"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// TODO: Replace with API call in Phase 3
const mockRules = [
  {
    id: "1",
    trigger: "Vencimiento en 3 días",
    condition: "dueDate <= today + 3 days",
    action: "Enviar recordatorio pre-vencimiento",
    status: "ACTIVE",
  },
  {
    id: "2",
    trigger: "Promesa vence hoy",
    condition: "promiseDate == today",
    action: "Enviar confirmación",
    status: "ACTIVE",
  },
  {
    id: "3",
    trigger: "Sin contacto por 7 días",
    condition: "lastContactAt < today - 7 days",
    action: "Escalar a revisión manual",
    status: "ACTIVE",
  },
  {
    id: "4",
    trigger: "Factura sin fecha",
    condition: "expectedPaymentDate == null",
    action: "Solicitar fecha esperada",
    status: "INACTIVE",
  },
];

export default function RulesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reglas</h1>
          <p className="text-sm text-muted-foreground">
            Define triggers y acciones para automatizar el comportamiento del agente
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Crear regla
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trigger</TableHead>
                <TableHead>Condición</TableHead>
                <TableHead>Acción</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockRules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">{rule.trigger}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {rule.condition}
                  </TableCell>
                  <TableCell>{rule.action}</TableCell>
                  <TableCell>
                    <Badge variant={rule.status === "ACTIVE" ? "default" : "secondary"}>
                      {rule.status === "ACTIVE" ? "Activa" : "Inactiva"}
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
    </div>
  );
}

