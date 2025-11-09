import { requireSession } from "@/lib/services/session";
import { getServices } from "@/lib/services/get-services";
import { CollectionCaseTable } from "@/components/collections/collection-case-table";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function CollectionsPage() {
  const session = await requireSession({ redirectTo: "/" });

  // El layout ya verifica que haya organización activa
  if (!session.organization?.id) {
    return null;
  }

  const context = {
    organizationId: session.organization.id,
    actorId: session.user.id,
  };

  const { collectionCasesService } = getServices(context);
  const result = await collectionCasesService.listCollectionCases(context, {
    pagination: { limit: 50 },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Casos de cobranza
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestiona y sigue el estado de tus cobranzas
          </p>
        </div>
      </div>

      {result.data.length === 0 ? (
        <EmptyState
          title="No hay casos de cobranza"
          description="Los casos de cobranza se crean automáticamente cuando se registran facturas."
        />
      ) : (
        <CollectionCaseTable cases={result.data} />
      )}
    </div>
  );
}

