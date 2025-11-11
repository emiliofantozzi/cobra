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
import type { CustomerCompany, CustomerCompanyStatus } from "@/lib/domain";

const companySchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(255),
  legalName: z.string().max(255).optional().or(z.literal("")),
  taxId: z.string().optional().or(z.literal("")),
  industry: z.string().optional().or(z.literal("")),
  website: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => !val || /^https?:\/\/.+/.test(val) || /^[^/]+/.test(val),
      "Debe ser una URL válida (ej: https://ejemplo.com)"
    ),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

type CompanyFormValues = z.infer<typeof companySchema>;

const INDUSTRIES = [
  "Tecnología",
  "Retail / Comercio",
  "Manufactura / Industria",
  "Servicios",
  "Construcción",
  "Salud",
  "Educación",
  "Finanzas",
  "Transporte / Logística",
  "Otro",
];

type CompanyFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: CustomerCompany;
  onSuccess?: () => void;
};

export function CompanyForm({ open, onOpenChange, company, onSuccess }: CompanyFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: "",
      legalName: "",
      taxId: "",
      industry: "",
      website: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (company && open) {
      form.reset({
        name: company.name,
        legalName: company.legalName || "",
        taxId: company.taxId || "",
        industry: company.industry || "",
        website: company.website || "",
        notes: company.notes || "",
      });
    } else if (!company && open) {
      form.reset({
        name: "",
        legalName: "",
        taxId: "",
        industry: "",
        website: "",
        notes: "",
      });
    }
  }, [company, open, form]);

  const normalizeWebsite = (url: string): string => {
    if (!url) return "";
    const trimmed = url.trim();
    if (!trimmed) return "";
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  const onSubmit = async (values: CompanyFormValues) => {
    setIsSubmitting(true);
    try {
      const url = company
        ? `/api/portfolio/companies/${company.id}`
        : "/api/portfolio/companies";
      const method = company ? "PATCH" : "POST";

      const payload = {
        ...values,
        website: values.website ? normalizeWebsite(values.website) : undefined,
        legalName: values.legalName || undefined,
        taxId: values.taxId || undefined,
        industry: values.industry || undefined,
        notes: values.notes || undefined,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al guardar empresa");
      }

      form.reset();
      onOpenChange(false);
      router.refresh();
      onSuccess?.();
    } catch (error) {
      console.error("Error saving company:", error);
      if (error instanceof Error) {
        form.setError("root", { message: error.message });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{company ? "Editar Empresa" : "Nueva Empresa"}</DialogTitle>
          <DialogDescription>
            {company
              ? "Actualiza la información de la empresa"
              : "Completa los datos para crear una nueva empresa cliente"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Nombre <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Corporation" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="legalName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Razón Social</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Corporation SpA" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="taxId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RUT / Tax ID</FormLabel>
                  <FormControl>
                    <Input placeholder="76.123.456-7" {...field} />
                  </FormControl>
                  <FormDescription>
                    Ej: 12.345.678-9 (Chile), 20-12345678-9 (Argentina)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Industria</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar industria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {INDUSTRIES.map((industry) => (
                        <SelectItem key={industry} value={industry}>
                          {industry}
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
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sitio web</FormLabel>
                  <FormControl>
                    <Input placeholder="https://ejemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notas sobre la empresa, contactos clave, preferencias..."
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
                loadingText={company ? "Guardando cambios..." : "Creando empresa..."}
              >
                {company ? "Guardar cambios" : "Crear empresa"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

