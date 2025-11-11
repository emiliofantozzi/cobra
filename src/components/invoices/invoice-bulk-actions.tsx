"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Edit, CheckCircle, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { InvoiceId, DateOrigin } from "@/lib/domain";

const DATE_ORIGINS: { value: DateOrigin; label: string }[] = [
  { value: "LOADED", label: "Cargada (al importar)" },
  { value: "REQUESTED_BY_AGENT", label: "Solicitada por agente" },
  { value: "CONFIRMED_BY_CLIENT", label: "Confirmada por cliente" },
];

type InvoiceBulkActionsProps = {
  selectedIds: InvoiceId[];
  onSelectionChange: (ids: InvoiceId[]) => void;
};

export function InvoiceBulkActions({
  selectedIds,
  onSelectionChange,
}: InvoiceBulkActionsProps) {
  const router = useRouter();
  const [showDateDialog, setShowDateDialog] = useState(false);
  const [showPaidDialog, setShowPaidDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState("");
  const [origin, setOrigin] = useState<DateOrigin>("LOADED");
  const [error, setError] = useState<string | null>(null);

  const handleBulkUpdateDates = async () => {
    if (!date || !origin) {
      setError("Debe completar fecha y origen");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/portfolio/invoices/bulk/expected-dates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceIds: selectedIds,
          expectedPaymentDate: date,
          dateOrigin: origin,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al actualizar fechas");
      }

      setShowDateDialog(false);
      setDate("");
      onSelectionChange([]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar fechas");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkMarkPaid = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/portfolio/invoices/bulk/mark-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceIds: selectedIds,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al marcar facturas como pagadas");
      }

      setShowPaidDialog(false);
      onSelectionChange([]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al marcar facturas como pagadas");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (selectedIds.length === 0) {
    return null;
  }

  return (
    <>
      <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-2">
        <span className="text-sm text-muted-foreground">
          {selectedIds.length} factura{selectedIds.length !== 1 ? "s" : ""} seleccionada
          {selectedIds.length !== 1 ? "s" : ""}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setShowDateDialog(true)}
          >
            <Edit className="h-4 w-4" />
            Editar fecha esperada
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setShowPaidDialog(true)}
          >
            <CheckCircle className="h-4 w-4" />
            Marcar como pagadas
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectionChange([])}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Dialog para editar fechas */}
      <Dialog open={showDateDialog} onOpenChange={setShowDateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar fecha esperada</DialogTitle>
            <DialogDescription>
              Establecer fecha esperada de pago para {selectedIds.length} factura
              {selectedIds.length !== 1 ? "s" : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-date">Fecha esperada</Label>
              <Input
                id="bulk-date"
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setError(null);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bulk-origin">Origen</Label>
              <Select value={origin} onValueChange={(value) => setOrigin(value as DateOrigin)}>
                <SelectTrigger id="bulk-origin">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATE_ORIGINS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {error && <div className="text-sm text-destructive">{error}</div>}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDateDialog(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleBulkUpdateDates}
              loading={isSubmitting}
              loadingText={`Actualizando ${selectedIds.length} factura${selectedIds.length !== 1 ? "s" : ""}...`}
              disabled={!date}
            >
              Actualizar {selectedIds.length} factura{selectedIds.length !== 1 ? "s" : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para marcar como pagadas */}
      <Dialog open={showPaidDialog} onOpenChange={setShowPaidDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar como pagadas</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas marcar {selectedIds.length} factura
              {selectedIds.length !== 1 ? "s" : ""} como pagada{selectedIds.length !== 1 ? "s" : ""}?
            </DialogDescription>
          </DialogHeader>
          {error && <div className="text-sm text-destructive">{error}</div>}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPaidDialog(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleBulkMarkPaid}
              loading={isSubmitting}
              loadingText="Marcando como pagadas..."
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

