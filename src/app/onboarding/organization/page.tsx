import { redirect } from "next/navigation";
import { requireSession } from "@/lib/services/session";
import { getActiveOrganization, createOrganizationWithOwner } from "@/lib/services/organizations";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { randomBytes } from "crypto";

export default async function OnboardingOrganizationPage() {
  const session = await requireSession({ redirectTo: "/" });

  // Si ya tiene organización activa, redirigir al dashboard
  const activeOrg = await getActiveOrganization(session.user.id);
  if (activeOrg) {
    redirect("/dashboard");
  }

  async function createOrganization(
    formData: FormData,
  ): Promise<
    | { success: true; isDuplicate: boolean; message?: string }
    | { success: false; error: string; code: string }
  > {
    "use server";

    const session = await requireSession({ redirectTo: "/" });

    const name = formData.get("name") as string;
    const countryCode = formData.get("countryCode") as string | null;
    const defaultCurrency = formData.get("defaultCurrency") as string | null;
    const idempotencyKey = formData.get("idempotencyKey") as string | null;

    if (!name || !name.trim()) {
      return {
        success: false as const,
        error: "El nombre de la organización es requerido",
        code: "VALIDATION_ERROR",
      };
    }

    // Normalizar countryCode: si es "none" o vacío, convertir a null
    const normalizedCountryCode =
      !countryCode || countryCode === "none" || countryCode.trim() === ""
        ? null
        : countryCode.trim();

    // Generate idempotency key if not provided
    const finalIdempotencyKey =
      idempotencyKey ||
      `org-create-${session.user.id}-${Date.now()}-${randomBytes(8).toString("hex")}`;

    const result = await createOrganizationWithOwner({
      userId: session.user.id,
      name: name.trim(),
      countryCode: normalizedCountryCode,
      defaultCurrency: defaultCurrency || "USD",
      idempotencyKey: finalIdempotencyKey,
    });

    if (!result.success) {
      return {
        success: false as const,
        error: result.error,
        code: result.code,
      };
    }

    // Return success - client will handle redirect
    return {
      success: true as const,
      isDuplicate: result.isDuplicate,
      message: result.isDuplicate ? result.message : undefined,
    };
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-24">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Configura tu organización
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Comienza configurando tu primera organización en COBRA
          </p>
        </div>
        <OnboardingForm onSubmit={createOrganization} />
      </div>
    </div>
  );
}

