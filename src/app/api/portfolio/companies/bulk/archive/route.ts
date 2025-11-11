import { NextResponse } from "next/server";
import { requireSession } from "@/lib/services/session";
import { getServices } from "@/lib/services/get-services";
import { requirePermission } from "@/lib/utils/permissions";
import * as Sentry from "@sentry/nextjs";

export async function POST(request: Request) {
  return Sentry.startSpan(
    {
      op: "http.server",
      name: "POST /api/portfolio/companies/bulk/archive",
    },
    async () => {
      try {
        const session = await requireSession();
        if (!session.organization?.id) {
          return NextResponse.json({ error: "No active organization" }, { status: 403 });
        }

        requirePermission(session.user.role, "companies:archive");

        const context = {
          organizationId: session.organization.id,
          actorId: session.user.id,
        };

        const body = await request.json();
        const { ids } = body;

        if (!Array.isArray(ids) || ids.length === 0) {
          return NextResponse.json({ error: "Se requiere un array de IDs" }, { status: 400 });
        }

        const { customersService } = getServices(context);
        const count = await customersService.bulkArchiveCustomerCompanies(context, ids);

        Sentry.startSpan(
          {
            op: "ui.action",
            name: "ui.portfolio.companies.bulk_archived",
          },
          () => {
            Sentry.setContext("companies_bulk_archive", {
              organizationId: context.organizationId,
              userId: context.actorId,
              count,
              companyIds: ids,
            });
          }
        );

        return NextResponse.json({ count, message: `${count} empresas archivadas` });
      } catch (error) {
        Sentry.captureException(error, {
          tags: { feature: "companies", action: "bulk_archive" },
        });
        return NextResponse.json(
          {
            error: error instanceof Error ? error.message : "Error al archivar empresas",
          },
          { status: error instanceof Error && error.message.includes("permiso") ? 403 : 400 }
        );
      }
    }
  );
}

