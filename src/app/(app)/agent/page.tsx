"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff } from "lucide-react";

export default function AgentBaseRulesPage() {
  const [isPreview, setIsPreview] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Regla base del agente</h1>
          <p className="text-sm text-muted-foreground">
            Configura los parámetros fundamentales del comportamiento del agente
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsPreview(!isPreview)}
            className="gap-2"
          >
            {isPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            Vista previa
          </Button>
          <Badge variant={isPreview ? "default" : "secondary"}>
            {isPreview ? "Staging" : "Producción"}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ventanas horarias</CardTitle>
          <CardDescription>
            Define los horarios en los que el agente puede enviar mensajes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Inicio</Label>
              <Input type="time" defaultValue="09:00" />
            </div>
            <div className="space-y-2">
              <Label>Fin</Label>
              <Input type="time" defaultValue="18:00" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Límites de mensajería</CardTitle>
          <CardDescription>
            Controla la cantidad de mensajes que el agente puede enviar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Límite diario de mensajes</Label>
            <Input type="number" defaultValue="100" min="1" />
            <p className="text-xs text-muted-foreground">
              Número máximo de mensajes que el agente puede enviar por día
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tono e idioma</CardTitle>
          <CardDescription>
            Personaliza el estilo de comunicación del agente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tono</Label>
            <Select defaultValue="professional">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="friendly">Amigable</SelectItem>
                <SelectItem value="professional">Profesional</SelectItem>
                <SelectItem value="formal">Formal</SelectItem>
                <SelectItem value="firm">Firme</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Idioma</Label>
            <Select defaultValue="es">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="pt">Português</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Umbral de escalamiento</CardTitle>
          <CardDescription>
            Define cuándo el agente debe escalar casos a revisión manual
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Días sin respuesta</Label>
            <Input type="number" defaultValue="7" min="1" />
            <p className="text-xs text-muted-foreground">
              Número de días sin respuesta antes de escalar
            </p>
          </div>
          <div className="space-y-2">
            <Label>Límite de reintentos</Label>
            <Input type="number" defaultValue="3" min="1" />
            <p className="text-xs text-muted-foreground">
              Número máximo de intentos antes de escalar
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline">Cancelar</Button>
        <Button>Guardar cambios</Button>
      </div>
    </div>
  );
}

