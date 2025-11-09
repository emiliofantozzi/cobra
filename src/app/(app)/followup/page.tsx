"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Send,
  Clock,
  Edit,
  MessageSquare,
  Mail,
  MessageCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// TODO: Replace with API call in Phase 3
const mockFilterChips = [
  { id: "sin-fecha", label: "Sin fecha", count: 12, active: false },
  { id: "vencen-hoy", label: "Vencen hoy", count: 5, active: false },
  { id: "vencidas", label: "Vencidas", count: 23, active: true },
  { id: "promesas-hoy", label: "Promesas hoy", count: 3, active: false },
  { id: "promesa-incumplida", label: "Promesa incumplida", count: 2, active: false },
  { id: "disputa", label: "Disputa/Humano", count: 1, active: false },
];

// TODO: Replace with API call in Phase 3
const mockFollowupItems = [
  {
    id: "1",
    empresa: "Acme Corp",
    factura: "FAC-2024-001",
    monto: 12500.0,
    estado: "Vencida",
    proximaAccion: "Enviar recordatorio",
    proximaAccionAt: "2024-01-15T10:00:00Z",
    canalSugerido: "EMAIL",
    ultimoResultado: "No respondido",
  },
  {
    id: "2",
    empresa: "Tech Solutions",
    factura: "FAC-2024-002",
    monto: 8500.0,
    estado: "Sin fecha",
    proximaAccion: "Solicitar fecha",
    proximaAccionAt: "2024-01-15T14:00:00Z",
    canalSugerido: "WHATSAPP",
    ultimoResultado: "Entregado",
  },
  {
    id: "3",
    empresa: "Global Industries",
    factura: "FAC-2024-003",
    monto: 22000.0,
    estado: "Promesa hoy",
    proximaAccion: "Confirmar pago",
    proximaAccionAt: "2024-01-15T09:00:00Z",
    canalSugerido: "EMAIL",
    ultimoResultado: "Respondido",
  },
];

// TODO: Replace with API call in Phase 3
const mockThreadMessages = [
  {
    id: "1",
    timestamp: "2024-01-14T10:30:00Z",
    direction: "OUTBOUND",
    channel: "EMAIL",
    content: "Recordatorio de pago pendiente para la factura FAC-2024-001",
    status: "DELIVERED",
  },
  {
    id: "2",
    timestamp: "2024-01-14T11:15:00Z",
    direction: "INBOUND",
    channel: "EMAIL",
    content: "Recibido, revisando con contabilidad",
    status: "ACKNOWLEDGED",
  },
];

export default function FollowupPage() {
  const [selectedChip, setSelectedChip] = useState("vencidas");
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [threadOpen, setThreadOpen] = useState(false);

  const getStatusBadgeVariant = (estado: string) => {
    switch (estado) {
      case "Vencida":
        return "destructive";
      case "Sin fecha":
        return "secondary";
      case "Promesa hoy":
        return "default";
      default:
        return "outline";
    }
  };

  const getChannelIcon = (canal: string) => {
    switch (canal) {
      case "EMAIL":
        return Mail;
      case "WHATSAPP":
        return MessageCircle;
      default:
        return MessageSquare;
    }
  };

  const getResultIcon = (resultado: string) => {
    switch (resultado) {
      case "Respondido":
        return CheckCircle2;
      case "No respondido":
        return XCircle;
      default:
        return MessageSquare;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Seguimiento</h1>
        <p className="text-sm text-muted-foreground">
          Bandeja única para gestionar todas tus cobranzas
        </p>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        {mockFilterChips.map((chip) => (
          <Button
            key={chip.id}
            variant={chip.active || selectedChip === chip.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedChip(chip.id)}
            className="gap-2"
          >
            {chip.label}
            <Badge variant="secondary" className="ml-1">
              {chip.count}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            Guardar vista
          </Button>
          <Button variant="outline" size="sm">
            Filtros
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          {mockFollowupItems.length} elementos
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Factura</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Próxima acción</TableHead>
                <TableHead>Canal sugerido</TableHead>
                <TableHead>Último resultado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockFollowupItems.map((item) => {
                const ChannelIcon = getChannelIcon(item.canalSugerido);
                const ResultIcon = getResultIcon(item.ultimoResultado);
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.empresa}</TableCell>
                    <TableCell className="font-mono text-sm">{item.factura}</TableCell>
                    <TableCell>${item.monto.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(item.estado)}>
                        {item.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{item.proximaAccion}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.proximaAccionAt).toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ChannelIcon className="h-4 w-4" />
                        <span className="text-sm">{item.canalSugerido}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ResultIcon className="h-4 w-4" />
                        <span className="text-sm">{item.ultimoResultado}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Enviar ahora"
                          onClick={() => {
                            // TODO: Implement in Phase 3
                          }}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Posponer"
                          onClick={() => {
                            // TODO: Implement in Phase 3
                          }}
                        >
                          <Clock className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Editar fecha"
                          onClick={() => {
                            // TODO: Implement in Phase 3
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Ver hilo"
                          onClick={() => {
                            setSelectedItem(item.id);
                            setThreadOpen(true);
                          }}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Thread Panel */}
      <Sheet open={threadOpen} onOpenChange={setThreadOpen}>
        <SheetContent className="w-full sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>Hilo de conversación</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {mockThreadMessages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "rounded-lg border p-4",
                  message.direction === "OUTBOUND"
                    ? "bg-muted ml-auto max-w-[80%]"
                    : "bg-background mr-auto max-w-[80%]",
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium">
                    {message.direction === "OUTBOUND" ? "Enviado" : "Recibido"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(message.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm">{message.content}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {message.channel}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {message.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

