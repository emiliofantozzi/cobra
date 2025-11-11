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
import { Checkbox } from "@/components/ui/checkbox";
import { validateEmail, validateE164, COMMON_TIMEZONES } from "@/lib/utils/validation/channel-validators";
import type { Contact, CustomerCompany } from "@/lib/domain";

const contactSchema = z
  .object({
    customerCompanyId: z.string().min(1, "Debe seleccionar una empresa"),
    firstName: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
    lastName: z.string().max(100).optional().or(z.literal("")),
    position: z.string().max(100).optional().or(z.literal("")),
    role: z.enum(["BILLING_AP", "OPERATIONS", "DECISION_MAKER", "OTHER"]),
    email: z.string().optional().or(z.literal("")),
    phoneNumber: z.string().optional().or(z.literal("")),
    whatsappNumber: z.string().optional().or(z.literal("")),
    preferredChannel: z.enum(["EMAIL", "WHATSAPP", "SMS", "PHONE"]).optional(),
    language: z.string().optional().or(z.literal("")),
    timezone: z.string().optional().or(z.literal("")),
    isPrimary: z.boolean(),
    isBillingContact: z.boolean(),
    notes: z.string().max(2000).optional().or(z.literal("")),
  })
  .refine(
    (data) => Boolean(data.email || data.phoneNumber || data.whatsappNumber),
    {
      message: "Debe proporcionar al menos un canal de contacto (email, teléfono o WhatsApp)",
      path: ["email"],
    }
  )
  .refine(
    (data) => !data.email || validateEmail(data.email),
    {
      message: "Email inválido (ej: usuario@dominio.com)",
      path: ["email"],
    }
  )
  .refine(
    (data) => !data.phoneNumber || validateE164(data.phoneNumber),
    {
      message: "Teléfono inválido. Usar formato internacional: +56912345678",
      path: ["phoneNumber"],
    }
  )
  .refine(
    (data) => !data.whatsappNumber || validateE164(data.whatsappNumber),
    {
      message: "WhatsApp inválido. Usar formato internacional: +56912345678",
      path: ["whatsappNumber"],
    }
  );

type ContactFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companies: CustomerCompany[];
  contact?: Contact;
  onSuccess?: () => void;
};

export function ContactForm({ open, onOpenChange, companies, contact, onSuccess }: ContactFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      customerCompanyId: contact?.customerCompanyId || "",
      firstName: contact?.firstName || "",
      lastName: contact?.lastName || "",
      position: contact?.position || "",
      role: contact?.role || "OTHER",
      email: contact?.email || "",
      phoneNumber: contact?.phoneNumber || "",
      whatsappNumber: contact?.whatsappNumber || "",
      preferredChannel: contact?.preferredChannel && ["EMAIL", "WHATSAPP", "SMS", "PHONE"].includes(contact.preferredChannel) 
        ? (contact.preferredChannel as "EMAIL" | "WHATSAPP" | "SMS" | "PHONE")
        : undefined,
      language: contact?.language || "",
      timezone: contact?.timezone || "",
      isPrimary: contact?.isPrimary || false,
      isBillingContact: contact?.isBillingContact || false,
      notes: contact?.notes || "",
    },
  });

  useEffect(() => {
    if (open && contact) {
      form.reset({
        customerCompanyId: contact.customerCompanyId,
        firstName: contact.firstName || "",
        lastName: contact.lastName || "",
        position: contact.position || "",
        role: contact.role || "OTHER",
        email: contact.email || "",
        phoneNumber: contact.phoneNumber || "",
        whatsappNumber: contact.whatsappNumber || "",
        preferredChannel: contact.preferredChannel && ["EMAIL", "WHATSAPP", "SMS", "PHONE"].includes(contact.preferredChannel)
          ? (contact.preferredChannel as "EMAIL" | "WHATSAPP" | "SMS" | "PHONE")
          : undefined,
        language: contact.language || "",
        timezone: contact.timezone || "",
        isPrimary: contact.isPrimary || false,
        isBillingContact: contact.isBillingContact || false,
        notes: contact.notes || "",
      });
    } else if (open && !contact) {
      form.reset({
        customerCompanyId: "",
        firstName: "",
        lastName: "",
        position: "",
        role: "OTHER",
        email: "",
        phoneNumber: "",
        whatsappNumber: "",
        preferredChannel: undefined,
        language: "",
        timezone: "",
        isPrimary: false,
        isBillingContact: false,
        notes: "",
      });
    }
  }, [open, contact, form]);

  // Auto-set preferred channel based on available channels
  const watchedEmail = form.watch("email");
  const watchedPhone = form.watch("phoneNumber");
  const watchedWhatsapp = form.watch("whatsappNumber");
  const watchedPreferredChannel = form.watch("preferredChannel");

  useEffect(() => {
    if (!watchedPreferredChannel) {
      if (watchedEmail) {
        form.setValue("preferredChannel", "EMAIL");
      } else if (watchedWhatsapp) {
        form.setValue("preferredChannel", "WHATSAPP");
      } else if (watchedPhone) {
        form.setValue("preferredChannel", "PHONE");
      }
    }
  }, [watchedEmail, watchedPhone, watchedWhatsapp, watchedPreferredChannel, form]);

  const onSubmit = async (data: z.infer<typeof contactSchema>) => {
    setIsSubmitting(true);
    try {
      const url = contact
        ? `/api/portfolio/contacts/${contact.id}`
        : "/api/portfolio/contacts";
      const method = contact ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al guardar contacto");
      }

      // Reset form after successful creation (not on edit)
      if (!contact) {
        form.reset({
          customerCompanyId: "",
          firstName: "",
          lastName: "",
          position: "",
          role: "OTHER",
          email: "",
          phoneNumber: "",
          whatsappNumber: "",
          preferredChannel: undefined,
          language: "",
          timezone: "",
          isPrimary: false,
          isBillingContact: false,
          notes: "",
        });
      }

      onOpenChange(false);
      onSuccess?.();
      router.refresh();
    } catch (error) {
      console.error("Error saving contact:", error);
      alert(error instanceof Error ? error.message : "Error al guardar contacto");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{contact ? "Editar Contacto" : "Nuevo Contacto"}</DialogTitle>
          <DialogDescription>
            {contact
              ? "Actualiza la información del contacto"
              : "Completa la información del nuevo contacto"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="customerCompanyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empresa *</FormLabel>
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellido</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Posición</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ej: Gerente de Operaciones" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="BILLING_AP">Billing/AP</SelectItem>
                        <SelectItem value="OPERATIONS">Operaciones</SelectItem>
                        <SelectItem value="DECISION_MAKER">Decisor</SelectItem>
                        <SelectItem value="OTHER">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <FormLabel>Canales de comunicación (al menos uno requerido)</FormLabel>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="usuario@dominio.com" />
                    </FormControl>
                    <FormDescription>Formato: usuario@dominio.com</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+56912345678" />
                    </FormControl>
                    <FormDescription>Formato internacional: +56912345678</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="whatsappNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+56912345678" />
                    </FormControl>
                    <FormDescription>Formato internacional: +56912345678</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="preferredChannel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Canal preferido</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!watchedEmail && !watchedPhone && !watchedWhatsapp}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Auto-seleccionado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {watchedEmail && <SelectItem value="EMAIL">Email</SelectItem>}
                        {watchedWhatsapp && <SelectItem value="WHATSAPP">WhatsApp</SelectItem>}
                        {watchedPhone && <SelectItem value="PHONE">Teléfono</SelectItem>}
                        <SelectItem value="SMS">SMS</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Idioma</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar idioma" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="es">Español (ES)</SelectItem>
                        <SelectItem value="en">English (EN)</SelectItem>
                        <SelectItem value="pt">Português (PT)</SelectItem>
                        <SelectItem value="fr">Français (FR)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zona horaria</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar zona horaria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {COMMON_TIMEZONES.map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormField
                control={form.control}
                name="isPrimary"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Contacto primario</FormLabel>
                      <FormDescription>
                        Solo uno por empresa. Si se marca, se desmarcará el anterior automáticamente.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isBillingContact"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Contacto de facturación</FormLabel>
                      <FormDescription>
                        Solo uno por empresa. Si se marca, se desmarcará el anterior automáticamente.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas internas</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} placeholder="Notas sobre el contacto..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                loading={isSubmitting}
                loadingText={contact ? "Guardando cambios..." : "Creando contacto..."}
              >
                {contact ? "Guardar cambios" : "Crear contacto"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

