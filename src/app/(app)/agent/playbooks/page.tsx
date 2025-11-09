"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Play } from "lucide-react";
import { cn } from "@/lib/utils";

// TODO: Replace with API call in Phase 3
const mockPlaybooks = [
  {
    id: "suave",
    name: "Suave",
    description: "Enfoque amigable y paciente, ideal para clientes de confianza",
    sequence: [
      { day: 0, template: "Solicitar fecha esperada" },
      { day: 3, template: "Recordatorio pre-vencimiento" },
      { day: 7, template: "Recordatorio post-vencimiento" },
      { day: 14, template: "Escalamiento" },
    ],
    estimatedDays: 14,
    active: false,
  },
  {
    id: "estandar",
    name: "Estándar",
    description: "Balance entre amabilidad y firmeza, recomendado para la mayoría de casos",
    sequence: [
      { day: 0, template: "Solicitar fecha esperada" },
      { day: 2, template: "Recordatorio pre-vencimiento" },
      { day: 5, template: "Recordatorio post-vencimiento" },
      { day: 10, template: "Escalamiento" },
    ],
    estimatedDays: 10,
    active: true,
  },
  {
    id: "firme",
    name: "Firme",
    description: "Enfoque directo y profesional, para casos que requieren acción inmediata",
    sequence: [
      { day: 0, template: "Recordatorio pre-vencimiento" },
      { day: 1, template: "Recordatorio post-vencimiento" },
      { day: 3, template: "Escalamiento" },
    ],
    estimatedDays: 3,
    active: false,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Flujo personalizado para clientes corporativos con múltiples puntos de contacto",
    sequence: [
      { day: 0, template: "Solicitar fecha esperada" },
      { day: 1, template: "Recordatorio pre-vencimiento" },
      { day: 3, template: "Confirmación de promesa" },
      { day: 7, template: "Recordatorio post-vencimiento" },
      { day: 14, template: "Escalamiento" },
    ],
    estimatedDays: 14,
    active: false,
  },
];

export default function PlaybooksPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Playbooks</h1>
        <p className="text-sm text-muted-foreground">
          Selecciona un playbook preconfigurado o crea uno personalizado
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {mockPlaybooks.map((playbook) => {
          const isExpanded = expandedId === playbook.id;
          return (
            <Card key={playbook.id} className={cn(playbook.active && "border-primary")}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {playbook.name}
                      {playbook.active && (
                        <Badge variant="default">Activo</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {playbook.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tiempo estimado:</span>
                  <span className="font-medium">{playbook.estimatedDays} días</span>
                </div>

                {isExpanded && (
                  <div className="space-y-2 pt-2 border-t">
                    <p className="text-sm font-medium">Secuencia de mensajes:</p>
                    <div className="space-y-1">
                      {playbook.sequence.map((step, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-sm bg-muted p-2 rounded"
                        >
                          <span>Día {step.day}</span>
                          <Badge variant="outline">{step.template}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() =>
                      setExpandedId(isExpanded ? null : playbook.id)
                    }
                  >
                    <Eye className="h-4 w-4" />
                    Vista previa
                  </Button>
                  {!playbook.active && (
                    <Button className="flex-1 gap-2">
                      <Play className="h-4 w-4" />
                      Activar playbook
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

