"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, FlaskConical } from "lucide-react";

// TODO: Replace with API call in Phase 3
const mockTemplates = [
  {
    id: "1",
    key: "solicitar_fecha",
    name: "Solicitar fecha esperada",
    preview: "Hola {nombre}, ¿cuál es la fecha prevista de pago para la factura {numero}?",
    variables: ["nombre", "numero", "monto"],
    channel: "EMAIL",
    hasABTest: false,
  },
  {
    id: "2",
    key: "pre_vencimiento",
    name: "Recordatorio pre-vencimiento",
    preview: "Estimado {nombre}, te recordamos que la factura {numero} vence el {fecha_vencimiento}.",
    variables: ["nombre", "numero", "fecha_vencimiento", "monto"],
    channel: "EMAIL",
    hasABTest: true,
  },
  {
    id: "3",
    key: "confirmacion_promesa",
    name: "Confirmación de promesa",
    preview: "Gracias por confirmar el pago de {numero} para el {fecha_promesa}. Te recordaremos ese día.",
    variables: ["nombre", "numero", "fecha_promesa"],
    channel: "WHATSAPP",
    hasABTest: false,
  },
  {
    id: "4",
    key: "post_vencimiento",
    name: "Recordatorio post-vencimiento",
    preview: "La factura {numero} está vencida desde el {fecha_vencimiento}. Por favor, contáctanos para coordinar el pago.",
    variables: ["nombre", "numero", "fecha_vencimiento", "monto", "dias_vencido"],
    channel: "EMAIL",
    hasABTest: false,
  },
  {
    id: "5",
    key: "escalamiento",
    name: "Escalamiento",
    preview: "Hemos intentado contactarte varias veces sobre la factura {numero}. Por favor, contáctanos urgentemente.",
    variables: ["nombre", "numero", "monto"],
    channel: "EMAIL",
    hasABTest: false,
  },
];

export default function TemplatesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Plantillas</h1>
        <p className="text-sm text-muted-foreground">
          Gestiona las plantillas de mensajes del agente
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {mockTemplates.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {template.name}
                    {template.hasABTest && (
                      <Badge variant="secondary" className="gap-1">
                        <FlaskConical className="h-3 w-3" />
                        A/B Test
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Canal: {template.channel}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Vista previa:</p>
                <p className="text-sm bg-muted p-3 rounded-md">{template.preview}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Variables:</p>
                <div className="flex flex-wrap gap-1">
                  {template.variables.map((variable) => (
                    <Badge key={variable} variant="outline" className="text-xs">
                      {`{${variable}}`}
                    </Badge>
                  ))}
                </div>
              </div>
              <Button variant="outline" className="w-full gap-2">
                <Edit className="h-4 w-4" />
                Editar plantilla
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

