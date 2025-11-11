"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";
import type { InvoiceId, DateOrigin } from "@/lib/domain";
import { formatNextActionRelative } from "@/lib/utils/invoice-calculations";

const DATE_ORIGINS: { value: DateOrigin; label: string }[] = [
  { value: "LOADED", label: "Cargada (al importar)" },
  { value: "REQUESTED_BY_AGENT", label: "Solicitada por agente" },
  { value: "CONFIRMED_BY_CLIENT", label: "Confirmada por cliente" },
];

type InvoiceInlineDateEditProps = {
  invoiceId: InvoiceId;
  currentDate: Date | null | undefined;
  currentOrigin: DateOrigin | null | undefined;
  nextActionAt: Date | null | undefined;
  onSuccess?: () => void;
};

export function InvoiceInlineDateEdit({
  invoiceId,
  currentDate,
  currentOrigin,
  nextActionAt,
  onSuccess,
}: InvoiceInlineDateEditProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState(
    currentDate ? new Date(currentDate).toISOString().split("T")[0] : ""
  );
  const [origin, setOrigin] = useState<DateOrigin | null>(
    currentOrigin || null
  );
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (date && !origin) {
      setError("Debe seleccionar el origen de la fecha");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/portfolio/invoices/${invoiceId}/expected-date`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expectedPaymentDate: date || null,
          dateOrigin: origin || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al actualizar fecha");
      }

      setOpen(false);
      router.refresh();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar fecha");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/portfolio/invoices/${invoiceId}/expected-date`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expectedPaymentDate: null,
          dateOrigin: null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al limpiar fecha");
      }

      setOpen(false);
      router.refresh();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al limpiar fecha");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-1 font-normal hover:bg-accent"
        >
          {currentDate ? (
            <span className="text-sm">
              {new Date(currentDate).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "short",
              })}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">Sin fecha</span>
          )}
          <Calendar className="ml-2 h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-80">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-sm mb-2">Fecha esperada de pago</h4>
            {nextActionAt && (
              <p className="text-xs text-muted-foreground mb-2">
                Próxima acción: {formatNextActionRelative(nextActionAt)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Fecha</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setError(null);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="origin">Origen</Label>
              <Select
                value={origin || ""}
                onValueChange={(value) => {
                  setOrigin(value as DateOrigin);
                  setError(null);
                }}
                disabled={!date}
              >
              <SelectTrigger id="origin">
                <SelectValue placeholder="Seleccionar origen" />
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

          {error && (
            <div className="text-sm text-destructive">{error}</div>
          )}

          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClear}
              disabled={isSubmitting || !currentDate}
            >
              Limpiar
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                loading={isSubmitting}
                loadingText="Guardando..."
                disabled={Boolean(date && !origin)}
              >
                Guardar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

