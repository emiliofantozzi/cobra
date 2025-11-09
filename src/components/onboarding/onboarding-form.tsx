"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COUNTRIES = [
  { code: "AR", name: "Argentina" },
  { code: "BR", name: "Brasil" },
  { code: "CL", name: "Chile" },
  { code: "CO", name: "Colombia" },
  { code: "MX", name: "México" },
  { code: "PE", name: "Perú" },
  { code: "US", name: "Estados Unidos" },
  { code: "ES", name: "España" },
];

const CURRENCIES = [
  { code: "USD", name: "USD - Dólar estadounidense" },
  { code: "ARS", name: "ARS - Peso argentino" },
  { code: "BRL", name: "BRL - Real brasileño" },
  { code: "CLP", name: "CLP - Peso chileno" },
  { code: "COP", name: "COP - Peso colombiano" },
  { code: "MXN", name: "MXN - Peso mexicano" },
  { code: "PEN", name: "PEN - Sol peruano" },
  { code: "EUR", name: "EUR - Euro" },
];

type OnboardingFormProps = {
  onSubmit: (
    formData: FormData,
  ) => Promise<
    | { success: true; isDuplicate: boolean; message?: string }
    | { success: false; error: string; code: string }
  >;
};

type FormState =
  | { success: true; isDuplicate: boolean; message?: string }
  | { success: false; error: string; code: string }
  | null;

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending || disabled}>
      {pending ? "Creando..." : "Crear organización"}
    </Button>
  );
}

export function OnboardingForm({ onSubmit }: OnboardingFormProps) {
  const router = useRouter();
  const [countryCode, setCountryCode] = useState<string>("");
  const [defaultCurrency, setDefaultCurrency] = useState<string>("USD");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const idempotencyKeyRef = useRef<string | null>(null);
  const isSubmittingRef = useRef(false);

  // Generate idempotency key once on mount
  useEffect(() => {
    idempotencyKeyRef.current = `org-create-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }, []);

  const [state, formAction] = useFormState(async (prevState: FormState, formData: FormData) => {
    // Prevent multiple submissions using ref (synchronous check)
    if (isSubmittingRef.current) {
      return prevState;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      // Add idempotency key to form data
      if (idempotencyKeyRef.current) {
        formData.append("idempotencyKey", idempotencyKeyRef.current);
      }

      const result = await onSubmit(formData);

      if (result.success) {
        // Success - will trigger navigation in useEffect
        return result;
      }

      // Error case
      return {
        success: false as const,
        error: result.error,
        code: result.code,
      };
    } catch (error) {
      return {
        success: false as const,
        error:
          error instanceof Error
            ? error.message
            : "Error al crear la organización. Por favor intenta nuevamente.",
        code: "SERVER_ERROR",
      };
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }, null);

  // Handle navigation on success
  useEffect(() => {
    if (state?.success) {
      // Small delay to show success message if duplicate
      const timer = setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, state.isDuplicate ? 1500 : 100);

      return () => clearTimeout(timer);
    }
  }, [state, router]);

  // Reset submitting state when form is reset
  useEffect(() => {
    if (!state) {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información de la organización</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la organización *</Label>
            <Input
              id="name"
              name="name"
              placeholder="Mi Empresa S.A."
              required
              minLength={2}
              autoFocus
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="countryCode">País</Label>
            <Select
              value={countryCode || "none"}
              onValueChange={(value) => setCountryCode(value === "none" ? "" : value)}
              disabled={isSubmitting}
            >
              <SelectTrigger id="countryCode" className="w-full">
                <SelectValue placeholder="Selecciona un país (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No especificar</SelectItem>
                {COUNTRIES.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="countryCode" value={countryCode} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultCurrency">Moneda por defecto</Label>
            <Select
              value={defaultCurrency}
              onValueChange={setDefaultCurrency}
              disabled={isSubmitting}
            >
              <SelectTrigger id="defaultCurrency" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="defaultCurrency" value={defaultCurrency} />
          </div>

          {state?.success === false && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}

          {state?.success === true && state.isDuplicate && (
            <div className="rounded-md bg-blue-50 dark:bg-blue-950 p-3 text-sm text-blue-900 dark:text-blue-100">
              {state.message || "Esta empresa ya existe en tu cuenta. Redirigiendo al dashboard..."}
            </div>
          )}

          <SubmitButton disabled={isSubmitting} />
        </form>
      </CardContent>
    </Card>
  );
}

