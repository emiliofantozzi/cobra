"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download } from "lucide-react";

// TODO: Replace with API call in Phase 3
const mockSummaryMetrics = {
  recovered: 125000.0,
  recoveredPercentage: 68.5,
  withDatePercentage: 85.2,
  promisesFulfilledPercentage: 72.3,
};

// TODO: Replace with API call in Phase 3
const mockAgingData = [
  { range: "0-30 días", amount: 45000, count: 12 },
  { range: "31-60 días", amount: 32000, count: 8 },
  { range: "61-90 días", amount: 28000, count: 5 },
  { range: ">90 días", amount: 20000, count: 3 },
];

export default function SummaryReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Resumen</h1>
          <p className="text-sm text-muted-foreground">
            Métricas generales y análisis de cobranzas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="date-from">Desde</Label>
          <Input id="date-from" type="date" className="w-40" />
          <Label htmlFor="date-to">Hasta</Label>
          <Input id="date-to" type="date" className="w-40" />
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recuperado del periodo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${mockSummaryMetrics.recovered.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {mockSummaryMetrics.recoveredPercentage}% del total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">% con fecha asignada</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockSummaryMetrics.withDatePercentage}%
            </div>
            <p className="text-xs text-muted-foreground">
              Facturas con fecha esperada
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">% promesas cumplidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockSummaryMetrics.promisesFulfilledPercentage}%
            </div>
            <p className="text-xs text-muted-foreground">
              Promesas de pago cumplidas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total pendiente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$125,000</div>
            <p className="text-xs text-muted-foreground">
              Monto total en cobranza
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Aging Report */}
      <Card>
        <CardHeader>
          <CardTitle>Aging de facturas</CardTitle>
          <CardDescription>
            Distribución de facturas por antigüedad
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockAgingData.map((item) => (
              <div key={item.range} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.range}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      {item.count} facturas
                    </span>
                    <span className="text-sm font-semibold">
                      ${item.amount.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: `${(item.amount / 125000) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

