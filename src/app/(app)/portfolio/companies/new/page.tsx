import { requireSession } from "@/lib/services/session";
import { redirect } from "next/navigation";
import { CompanyFormClient } from "@/components/portfolio/companies/company-form-client";

export default async function NewCompanyPage() {
  const session = await requireSession({ redirectTo: "/" });

  if (!session.organization?.id) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nueva Empresa</h1>
        <p className="text-sm text-muted-foreground">
          Crea una nueva empresa cliente en tu organización
        </p>
      </div>
      <CompanyFormClient />
    </div>
  );
}

