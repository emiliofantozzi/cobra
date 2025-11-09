"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// TODO: Replace with API call in Phase 3
const mockAuditLogs = [
  {
    id: "1",
    entity: "Template",
    entityId: "template_1",
    action: "UPDATED",
    actor: "Juan Pérez",
    timestamp: "2024-01-15T10:30:00Z",
    changes: { field: "body", old: "Texto anterior", new: "Texto nuevo" },
  },
  {
    id: "2",
    entity: "Agent Rules",
    entityId: "rule_1",
    action: "CREATED",
    actor: "María García",
    timestamp: "2024-01-14T15:20:00Z",
    changes: { field: "trigger", value: "Vencimiento en 3 días" },
  },
  {
    id: "3",
    entity: "Collection Case",
    entityId: "case_1",
    action: "STATUS_CHANGED",
    actor: "Sistema",
    timestamp: "2024-01-14T09:15:00Z",
    changes: { field: "status", old: "ACTIVE", new: "PAUSED" },
  },
];

const actionLabels: Record<string, string> = {
  CREATED: "Creado",
  UPDATED: "Actualizado",
  DELETED: "Eliminado",
  STATUS_CHANGED: "Estado cambiado",
};

export default function AuditSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Auditoría</h1>
        <p className="text-sm text-muted-foreground">
          Registro de cambios críticos en el sistema
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entity">Entidad</Label>
              <Select>
                <SelectTrigger id="entity">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="Template">Plantillas</SelectItem>
                  <SelectItem value="Agent Rules">Reglas</SelectItem>
                  <SelectItem value="Collection Case">Casos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="action">Acción</Label>
              <Select>
                <SelectTrigger id="action">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="CREATED">Creado</SelectItem>
                  <SelectItem value="UPDATED">Actualizado</SelectItem>
                  <SelectItem value="DELETED">Eliminado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-from">Desde</Label>
              <Input id="date-from" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-to">Hasta</Label>
              <Input id="date-to" type="date" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registro de auditoría</CardTitle>
          <CardDescription>
            Historial de cambios en plantillas, reglas y estados críticos
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entidad</TableHead>
                <TableHead>Acción</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Cambios</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockAuditLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div>
                      <span className="font-medium">{log.entity}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({log.entityId})
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {actionLabels[log.action] || log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>{log.actor}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {log.changes.field && (
                        <span className="text-muted-foreground">
                          {log.changes.field}:{" "}
                        </span>
                      )}
                      {log.changes.old && (
                        <span className="line-through text-red-600">
                          {log.changes.old}
                        </span>
                      )}
                      {log.changes.old && log.changes.new && " → "}
                      {log.changes.new && (
                        <span className="text-green-600">{log.changes.new}</span>
                      )}
                      {log.changes.value && (
                        <span>{log.changes.value}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(log.timestamp).toLocaleString()}
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

