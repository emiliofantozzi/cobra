"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Download } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// TODO: Replace with API call in Phase 3
const mockPlan = {
  name: "Pro",
  price: 99,
  period: "mes",
  features: ["Hasta 10,000 facturas", "Soporte prioritario", "API access"],
};

// TODO: Replace with API call in Phase 3
const mockInvoices = [
  {
    id: "1",
    date: "2024-01-01",
    amount: 99.0,
    status: "PAID",
    downloadUrl: "#",
  },
  {
    id: "2",
    date: "2023-12-01",
    amount: 99.0,
    status: "PAID",
    downloadUrl: "#",
  },
];

export default function BillingSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="text-sm text-muted-foreground">
          Gestiona tu plan y método de pago
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plan actual</CardTitle>
          <CardDescription>
            Tu plan y características actuales
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{mockPlan.name}</h3>
              <p className="text-sm text-muted-foreground">
                ${mockPlan.price}/{mockPlan.period}
              </p>
            </div>
            <Badge variant="default">Activo</Badge>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Características incluidas:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {mockPlan.features.map((feature, idx) => (
                <li key={idx}>{feature}</li>
              ))}
            </ul>
          </div>
          <Button variant="outline">Cambiar plan</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Método de pago</CardTitle>
          <CardDescription>
            Gestiona tu tarjeta de crédito o método de pago
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">•••• •••• •••• 4242</p>
                <p className="text-xs text-muted-foreground">Expira 12/25</p>
              </div>
            </div>
            <Button variant="outline" size="sm">Actualizar</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial de facturas</CardTitle>
          <CardDescription>
            Descarga tus facturas anteriores
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                  <TableCell>${invoice.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={invoice.status === "PAID" ? "default" : "secondary"}>
                      {invoice.status === "PAID" ? "Pagada" : "Pendiente"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Download className="h-4 w-4" />
                      Descargar
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

