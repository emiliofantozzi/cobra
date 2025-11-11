import { NextResponse } from "next/server";
import { requireSession } from "@/lib/services/session";
import { getServices } from "@/lib/services/get-services";
import { requirePermission } from "@/lib/utils/permissions";
import * as Sentry from "@sentry/nextjs";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: RouteParams) {
  return Sentry.startSpan(
    {
      op: "http.server",
      name: "POST /api/portfolio/companies/[id]/archive",
    },
    async () => {
      try {
        const session = await requireSession();
        if (!session.organization?.id) {
          return NextResponse.json({ error: "No active organization" }, { status: 403 });
        }

        requirePermission(session.user.role, "companies:archive");

        const { id } = await params;
        const context = {
          organizationId: session.organization.id,
          actorId: session.user.id,
        };

        const { customersService } = getServices(context);
        const company = await customersService.getCustomerCompany(context, id as any);

        if (!company) {
          return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
        }

        const archivedCompany = await customersService.archiveCustomerCompany(context, id as any);

        Sentry.startSpan(
          {
            op: "ui.action",
            name: "ui.portfolio.companies.archived",
          },
          () => {
            Sentry.setContext("company_archive", {
              organizationId: context.organizationId,
              userId: context.actorId,
              companyId: id,
              name: company.name,
            });
          }
        );

        return NextResponse.json(archivedCompany);
      } catch (error) {
        Sentry.captureException(error, {
          tags: { feature: "companies", action: "archive" },
        });
        return NextResponse.json(
          {
            error: error instanceof Error ? error.message : "Error al archivar empresa",
          },
          { status: error instanceof Error && error.message.includes("permiso") ? 403 : 400 }
        );
      }
    }
  );
}

