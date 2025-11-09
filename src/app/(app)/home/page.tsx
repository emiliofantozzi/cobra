import { requireSession } from "@/lib/services/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Mail, MessageSquare, Upload, Plus, Building2 } from "lucide-react";
import Link from "next/link";

// TODO: Replace with API call in Phase 3
const mockOnboardingSteps = [
  { id: 1, label: "Conectar Email/WhatsApp", completed: false },
  { id: 2, label: "Importar facturas", completed: false },
  { id: 3, label: "Definir regla base", completed: false },
  { id: 4, label: "Elegir plantillas", completed: false },
  { id: 5, label: "Activar agente", completed: false },
];

// TODO: Replace with API call in Phase 3
const mockKPIs = {
  sinFecha: 12,
  vencenHoy: 5,
  vencidas: 23,
  promesasHoy: 3,
};

export default async function HomePage() {
  const session = await requireSession({ redirectTo: "/" });

  if (!session.organization?.id) {
    return null;
  }

  const incompleteSteps = mockOnboardingSteps.filter((step) => !step.completed);
  const hasIncompleteSteps = incompleteSteps.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Hoy</h1>
        <p className="text-sm text-muted-foreground">
          Resumen de tu actividad y próximos pasos
        </p>
      </div>

      {/* Onboarding Checklist */}
      {hasIncompleteSteps && (
        <Card>
          <CardHeader>
            <CardTitle>Configuración inicial</CardTitle>
            <CardDescription>
              Completa estos pasos para comenzar a usar COBRA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockOnboardingSteps.map((step) => (
                <div key={step.id} className="flex items-center gap-3">
                  {step.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span
                    className={
                      step.completed
                        ? "text-sm text-muted-foreground line-through"
                        : "text-sm font-medium"
                    }
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sin fecha</CardTitle>
            <Badge variant="secondary">{mockKPIs.sinFecha}</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Facturas sin fecha esperada de pago
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencen hoy</CardTitle>
            <Badge variant="default">{mockKPIs.vencenHoy}</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Facturas que vencen hoy
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidas</CardTitle>
            <Badge variant="destructive">{mockKPIs.vencidas}</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Facturas vencidas sin pago
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promesas hoy</CardTitle>
            <Badge variant="outline">{mockKPIs.promesasHoy}</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Promesas de pago para hoy
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones rápidas</CardTitle>
          <CardDescription>Accesos directos a funciones comunes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline" className="gap-2">
              <Link href="/settings/data">
                <Upload className="h-4 w-4" />
                Importar CSV
              </Link>
            </Button>
            <Button asChild variant="outline" className="gap-2">
              <Link href="/portfolio/invoices/new">
                <Plus className="h-4 w-4" />
                Crear factura
              </Link>
            </Button>
            <Button asChild variant="outline" className="gap-2">
              <Link href="/portfolio/companies/new">
                <Building2 className="h-4 w-4" />
                Crear empresa
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Channel Health */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estado</span>
                <Badge variant="secondary">Pendiente configurar</Badge>
              </div>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href="/agent/channels">Configurar Email</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              WhatsApp
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estado</span>
                <Badge variant="secondary">Pendiente configurar</Badge>
              </div>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href="/agent/channels">Conectar WhatsApp</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

