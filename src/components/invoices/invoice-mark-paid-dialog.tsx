"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle } from "lucide-react";
import type { InvoiceId } from "@/lib/domain";

type InvoiceMarkPaidDialogProps = {
  invoiceId: InvoiceId;
  invoiceNumber?: string;
  amount: number;
  currency: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
};

export function InvoiceMarkPaidDialog({
  invoiceId,
  invoiceNumber,
  amount,
  currency,
  trigger,
  onSuccess,
}: InvoiceMarkPaidDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentReference, setPaymentReference] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/portfolio/invoices/${invoiceId}/mark-paid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentReference: paymentReference || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al marcar factura como pagada");
      }

      setOpen(false);
      setPaymentReference("");
      router.refresh();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al marcar factura como pagada");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Marcar como pagada
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Marcar factura como pagada</DialogTitle>
          <DialogDescription>
            {invoiceNumber ? `Factura ${invoiceNumber}` : "Esta factura"} será marcada como pagada.
            <br />
            Monto: {new Intl.NumberFormat("es-ES", {
              style: "currency",
              currency,
            }).format(amount)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="payment-reference">Referencia de pago (opcional)</Label>
            <Input
              id="payment-reference"
              placeholder="Ej: Transferencia #12345, Cheque #67890"
              value={paymentReference}
              onChange={(e) => {
                setPaymentReference(e.target.value);
                setError(null);
              }}
            />
          </div>
          {error && <div className="text-sm text-destructive">{error}</div>}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            loading={isSubmitting}
            loadingText="Marcando como pagada..."
          >
            Confirmar pago
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

