"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// TODO: Replace with API call in Phase 3
const mockChannelStats = [
  { channel: "EMAIL", sent: 450, opened: 320, responded: 85, openRate: 71.1, responseRate: 18.9 },
  { channel: "WHATSAPP", sent: 280, opened: 265, responded: 120, openRate: 94.6, responseRate: 42.9 },
];

// TODO: Replace with API call in Phase 3
const mockTemplatePerformance = [
  { template: "Solicitar fecha esperada", sent: 120, responded: 45, rate: 37.5 },
  { template: "Recordatorio pre-vencimiento", sent: 200, responded: 60, rate: 30.0 },
  { template: "Confirmación de promesa", sent: 80, responded: 35, rate: 43.8 },
  { template: "Recordatorio post-vencimiento", sent: 150, responded: 40, rate: 26.7 },
  { template: "Escalamiento", sent: 180, responded: 30, rate: 16.7 },
];

export default function EffectivenessReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Efectividad</h1>
        <p className="text-sm text-muted-foreground">
          Análisis de desempeño por canal y plantilla
        </p>
      </div>

      {/* Channel Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Desempeño por canal</CardTitle>
          <CardDescription>
            Métricas de apertura y respuesta por canal de comunicación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockChannelStats.map((stat) => (
              <div key={stat.channel} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{stat.channel}</span>
                  <div className="flex items-center gap-6 text-sm">
                    <span className="text-muted-foreground">
                      Enviados: <span className="font-medium">{stat.sent}</span>
                    </span>
                    <span className="text-muted-foreground">
                      Abiertos: <span className="font-medium">{stat.opened}</span>
                    </span>
                    <span className="text-muted-foreground">
                      Respondidos: <span className="font-medium">{stat.responded}</span>
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Tasa de apertura</span>
                      <span className="text-xs font-medium">{stat.openRate}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${stat.openRate}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Tasa de respuesta</span>
                      <span className="text-xs font-medium">{stat.responseRate}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-600"
                        style={{ width: `${stat.responseRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Template Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Desempeño por plantilla</CardTitle>
          <CardDescription>
            Efectividad de cada plantilla de mensaje
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plantilla</TableHead>
                <TableHead>Enviados</TableHead>
                <TableHead>Respondidos</TableHead>
                <TableHead>Tasa de respuesta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTemplatePerformance.map((template) => (
                <TableRow key={template.template}>
                  <TableCell className="font-medium">{template.template}</TableCell>
                  <TableCell>{template.sent}</TableCell>
                  <TableCell>{template.responded}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{template.rate}%</span>
                      <div className="h-2 w-20 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${template.rate}%` }}
                        />
                      </div>
                    </div>
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

