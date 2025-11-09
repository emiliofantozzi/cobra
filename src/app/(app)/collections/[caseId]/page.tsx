import { requireSession } from "@/lib/services/session";
import { getServices } from "@/lib/services/get-services";
import { notFound } from "next/navigation";
import { CollectionTimeline } from "@/components/collections/collection-timeline";
import { CollectionCaseOverview } from "@/components/collections/collection-case-overview";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

type CollectionCaseDetailPageProps = {
  params: Promise<{ caseId: string }>;
};

export default async function CollectionCaseDetailPage({
  params,
}: CollectionCaseDetailPageProps) {
  const { caseId } = await params;
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
  const [caseItem, communicationsResult] = await Promise.all([
    collectionCasesService.getCollectionCase(context, caseId as any),
    collectionCasesService.listCommunications(context, {
      collectionCaseId: caseId as any,
      pagination: { limit: 50 },
    }),
  ]);

  if (!caseItem) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/collections">Cobranzas</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>Caso #{caseId.slice(0, 8)}</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <CollectionCaseOverview caseItem={caseItem} />
      <CollectionTimeline
        caseItem={caseItem}
        communications={communicationsResult.data}
      />
    </div>
  );
}

