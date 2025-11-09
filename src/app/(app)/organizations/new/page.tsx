import { requireSession } from "@/lib/services/session";
import { createOrganizationWithOwner } from "@/lib/services/organizations";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { randomBytes } from "crypto";

export default async function NewOrganizationPage() {
  const session = await requireSession({ redirectTo: "/" });

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
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Nueva organización
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Crea una nueva organización en COBRA
        </p>
      </div>
      <OnboardingForm onSubmit={createOrganization} />
    </div>
  );
}

