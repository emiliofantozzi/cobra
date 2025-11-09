"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Download, FileSpreadsheet } from "lucide-react";

export default function DataSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Datos</h1>
        <p className="text-sm text-muted-foreground">
          Importa y exporta datos de tu organización
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Importar datos</CardTitle>
          <CardDescription>
            Importa facturas, clientes y contactos desde un archivo CSV
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-4">
              Arrastra un archivo CSV aquí o haz clic para seleccionar
            </p>
            <Button className="gap-2">
              <Upload className="h-4 w-4" />
              Seleccionar archivo
            </Button>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Formatos soportados:</p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>CSV (UTF-8)</li>
              <li>Máximo 10,000 registros por importación</li>
            </ul>
          </div>
          <Button variant="outline" className="w-full">
            Abrir Import Wizard v2
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exportar datos</CardTitle>
          <CardDescription>
            Descarga tus datos en formato CSV
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Button variant="outline" className="justify-start gap-2">
              <Download className="h-4 w-4" />
              Exportar facturas
            </Button>
            <Button variant="outline" className="justify-start gap-2">
              <Download className="h-4 w-4" />
              Exportar empresas clientes
            </Button>
            <Button variant="outline" className="justify-start gap-2">
              <Download className="h-4 w-4" />
              Exportar contactos
            </Button>
            <Button variant="outline" className="justify-start gap-2">
              <Download className="h-4 w-4" />
              Exportar historial de comunicaciones
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

