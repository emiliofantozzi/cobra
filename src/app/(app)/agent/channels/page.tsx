"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, MessageCircle, CheckCircle2, XCircle, Send } from "lucide-react";

// TODO: Replace with API call in Phase 3
const mockEmailStatus = {
  domain: "example.com",
  dkim: "VERIFIED",
  spf: "VERIFIED",
  verified: false,
};

// TODO: Replace with API call in Phase 3
const mockWhatsAppStatus = {
  number: "+1234567890",
  bsp: "Meta",
  connected: false,
};

export default function ChannelsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Canales</h1>
        <p className="text-sm text-muted-foreground">
          Configura y verifica tus canales de comunicación
        </p>
      </div>

      {/* Email Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email
          </CardTitle>
          <CardDescription>
            Configuración de dominio y autenticación de email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Dominio</Label>
            <Input value={mockEmailStatus.domain} disabled />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>DKIM</Label>
              <div className="flex items-center gap-2">
                {mockEmailStatus.dkim === "VERIFIED" ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <Badge variant="default">Verificado</Badge>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-600" />
                    <Badge variant="destructive">No verificado</Badge>
                  </>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>SPF</Label>
              <div className="flex items-center gap-2">
                {mockEmailStatus.spf === "VERIFIED" ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <Badge variant="default">Verificado</Badge>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-600" />
                    <Badge variant="destructive">No verificado</Badge>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">Verificar</Button>
            <Button variant="outline" className="gap-2">
              <Send className="h-4 w-4" />
              Enviar prueba
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* WhatsApp Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            WhatsApp
          </CardTitle>
          <CardDescription>
            Configuración de WhatsApp Business API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Número</Label>
            <Input value={mockWhatsAppStatus.number} disabled />
          </div>
          <div className="space-y-2">
            <Label>BSP (Business Service Provider)</Label>
            <Input value={mockWhatsAppStatus.bsp} disabled />
          </div>
          <div className="space-y-2">
            <Label>Estado</Label>
            <div className="flex items-center gap-2">
              {mockWhatsAppStatus.connected ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <Badge variant="default">Conectado</Badge>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-red-600" />
                  <Badge variant="secondary">No conectado</Badge>
                </>
              )}
            </div>
          </div>
          <Button variant="outline">Conectar WhatsApp</Button>
        </CardContent>
      </Card>

      {/* Test Section */}
      <Card>
        <CardHeader>
          <CardTitle>Enviar mensaje de prueba</CardTitle>
          <CardDescription>
            Prueba la configuración de tus canales enviando un mensaje de prueba
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Destinatario</Label>
            <Input placeholder="email@example.com o +1234567890" />
          </div>
          <div className="space-y-2">
            <Label>Canal</Label>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Button>
              <Button variant="outline" className="gap-2">
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </Button>
            </div>
          </div>
          <Button>Enviar mensaje de prueba</Button>
        </CardContent>
      </Card>
    </div>
  );
}

