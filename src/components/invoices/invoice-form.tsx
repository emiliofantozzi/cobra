"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { Invoice, DateOrigin } from "@/lib/domain";
import type { CustomerCompany } from "@/lib/domain";
import { isValidCurrency, isValidAmount } from "@/lib/utils/validation/invoice-validators";

const invoiceSchema = z
  .object({
    customerCompanyId: z.string().min(1, "Debe seleccionar una empresa"),
    number: z.string().max(50).optional().or(z.literal("")),
    description: z.string().max(500).optional().or(z.literal("")),
    issueDate: z.string().min(1, "La fecha de emisión es requerida"),
    dueDate: z.string().min(1, "La fecha de vencimiento es requerida"),
    amount: z.string().min(1, "El monto es requerido"),
    currency: z.string().min(1, "La moneda es requerida"),
    expectedPaymentDate: z.string().optional().or(z.literal("")),
    dateOrigin: z.enum(["LOADED", "REQUESTED_BY_AGENT", "CONFIRMED_BY_CLIENT"]).optional(),
    notes: z.string().max(2000).optional().or(z.literal("")),
    status: z.enum(["DRAFT", "PENDING"]),
  })
  .refine(
    (data) => {
      if (!data.issueDate || !data.dueDate) return true;
      return new Date(data.issueDate) <= new Date(data.dueDate);
    },
    {
      message: "La fecha de emisión debe ser anterior o igual a la fecha de vencimiento",
      path: ["dueDate"],
    }
  )
  .refine(
    (data) => {
      if (!data.expectedPaymentDate || !data.issueDate) return true;
      return new Date(data.expectedPaymentDate) >= new Date(data.issueDate);
    },
    {
      message: "La fecha esperada debe ser posterior o igual a la fecha de emisión",
      path: ["expectedPaymentDate"],
    }
  )
  .refine(
    (data) => {
      if (data.expectedPaymentDate && !data.dateOrigin) {
        return false;
      }
      return true;
    },
    {
      message: "Debe seleccionar el origen de la fecha esperada",
      path: ["dateOrigin"],
    }
  )
  .refine(
    (data) => {
      const amount = parseFloat(data.amount);
      return isValidAmount(amount);
    },
    {
      message: "El monto debe ser positivo y tener máximo 2 decimales",
      path: ["amount"],
    }
  )
  .refine(
    (data) => {
      return isValidCurrency(data.currency);
    },
    {
      message: "Moneda no válida",
      path: ["currency"],
    }
  );

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

const CURRENCIES = [
  { value: "USD", label: "USD - Dólar estadounidense" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "CLP", label: "CLP - Peso chileno" },
  { value: "MXN", label: "MXN - Peso mexicano" },
  { value: "ARS", label: "ARS - Peso argentino" },
  { value: "COP", label: "COP - Peso colombiano" },
  { value: "BRL", label: "BRL - Real brasileño" },
  { value: "PEN", label: "PEN - Sol peruano" },
];

const DATE_ORIGINS: { value: DateOrigin; label: string }[] = [
  { value: "LOADED", label: "Cargada (al importar)" },
  { value: "REQUESTED_BY_AGENT", label: "Solicitada por agente" },
  { value: "CONFIRMED_BY_CLIENT", label: "Confirmada por cliente" },
];

type InvoiceFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice?: Invoice;
  companies: CustomerCompany[];
  onSuccess?: () => void;
};

export function InvoiceForm({
  open,
  onOpenChange,
  invoice,
  companies,
  onSuccess,
}: InvoiceFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customerCompanyId: "",
      number: "",
      description: "",
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      amount: "",
      currency: "USD",
      expectedPaymentDate: "",
      dateOrigin: undefined,
      notes: "",
      status: "PENDING" as const,
    },
  });

  useEffect(() => {
    if (invoice && open) {
      form.reset({
        customerCompanyId: invoice.customerCompanyId,
        number: invoice.number || "",
        description: invoice.description || "",
        issueDate: new Date(invoice.issueDate).toISOString().split("T")[0],
        dueDate: new Date(invoice.dueDate).toISOString().split("T")[0],
        amount: invoice.amount.toString(),
        currency: invoice.currency,
        expectedPaymentDate: invoice.expectedPaymentDate
          ? new Date(invoice.expectedPaymentDate).toISOString().split("T")[0]
          : "",
        dateOrigin: invoice.dateOrigin,
        notes: invoice.notes || "",
        status: invoice.status === "DRAFT" ? "DRAFT" : "PENDING",
      });
    } else if (!invoice && open) {
      form.reset({
        customerCompanyId: "",
        number: "",
        description: "",
        issueDate: new Date().toISOString().split("T")[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        amount: "",
        currency: "USD",
        expectedPaymentDate: "",
        dateOrigin: undefined,
        notes: "",
        status: "PENDING",
      });
    }
  }, [invoice, open, form]);

  const onSubmit = async (values: InvoiceFormValues) => {
    setIsSubmitting(true);
    try {
      const url = invoice
        ? `/api/portfolio/invoices/${invoice.id}`
        : "/api/portfolio/invoices";
      const method = invoice ? "PATCH" : "POST";

      const payload: any = {
        customerCompanyId: values.customerCompanyId,
        number: values.number || undefined,
        description: values.description || undefined,
        issueDate: new Date(values.issueDate).toISOString(),
        dueDate: new Date(values.dueDate).toISOString(),
        amount: parseFloat(values.amount),
        currency: values.currency,
        status: values.status,
        notes: values.notes || undefined,
      };

      if (values.expectedPaymentDate) {
        payload.expectedPaymentDate = new Date(values.expectedPaymentDate).toISOString();
        payload.dateOrigin = values.dateOrigin;
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al guardar factura");
      }

      form.reset();
      onOpenChange(false);
      router.refresh();
      onSuccess?.();
    } catch (error) {
      console.error("Error saving invoice:", error);
      if (error instanceof Error) {
        form.setError("root", { message: error.message });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{invoice ? "Editar Factura" : "Nueva Factura"}</DialogTitle>
          <DialogDescription>
            {invoice
              ? "Actualiza la información de la factura"
              : "Completa los datos para crear una nueva factura"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customerCompanyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Empresa <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar empresa" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de factura</FormLabel>
                    <FormControl>
                      <Input placeholder="FAC-2024-001" {...field} />
                    </FormControl>
                    <FormDescription>Opcional. Debe ser único por organización</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Input placeholder="Servicios de consultoría Q1 2024" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="issueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Fecha de emisión <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Fecha de vencimiento <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Monto <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="1000.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Moneda <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar moneda" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CURRENCIES.map((currency) => (
                          <SelectItem key={currency.value} value={currency.value}>
                            {currency.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="expectedPaymentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha esperada de pago</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          if (!e.target.value) {
                            form.setValue("dateOrigin", undefined);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dateOrigin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origen de fecha esperada</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!form.watch("expectedPaymentDate")}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar origen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DATE_ORIGINS.map((origin) => (
                          <SelectItem key={origin.value} value={origin.value}>
                            {origin.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Requerido si se establece fecha esperada
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notas internas sobre la factura..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {form.watch("notes")?.length || 0} / 2000 caracteres
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.formState.errors.root && (
              <div className="text-sm text-destructive">
                {form.formState.errors.root.message}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                loading={isSubmitting}
                loadingText={invoice ? "Guardando cambios..." : "Creando factura..."}
              >
                {invoice ? "Guardar cambios" : "Crear factura"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

