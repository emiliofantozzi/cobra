"use client";

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

export default function OrganizationSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mi organización</h1>
        <p className="text-sm text-muted-foreground">
          Configura los datos básicos de tu organización
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información general</CardTitle>
          <CardDescription>
            Datos básicos de la organización
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" placeholder="Nombre de la organización" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="logo">Logo</Label>
            <Input id="logo" type="file" accept="image/*" />
            <p className="text-xs text-muted-foreground">
              Sube el logo de tu organización (máx. 2MB)
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuración regional</CardTitle>
          <CardDescription>
            Ajustes de zona horaria, moneda y formato de fecha
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="timezone">Zona horaria</Label>
            <Select defaultValue="america/lima">
              <SelectTrigger id="timezone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="america/lima">Lima (GMT-5)</SelectItem>
                <SelectItem value="america/bogota">Bogotá (GMT-5)</SelectItem>
                <SelectItem value="america/mexico_city">Ciudad de México (GMT-6)</SelectItem>
                <SelectItem value="america/santiago">Santiago (GMT-3)</SelectItem>
                <SelectItem value="america/buenos_aires">Buenos Aires (GMT-3)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Moneda</Label>
            <Select defaultValue="USD">
              <SelectTrigger id="currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD - Dólar estadounidense</SelectItem>
                <SelectItem value="PEN">PEN - Sol peruano</SelectItem>
                <SelectItem value="COP">COP - Peso colombiano</SelectItem>
                <SelectItem value="MXN">MXN - Peso mexicano</SelectItem>
                <SelectItem value="ARS">ARS - Peso argentino</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="date-format">Formato de fecha</Label>
            <Select defaultValue="dd/mm/yyyy">
              <SelectTrigger id="date-format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
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

