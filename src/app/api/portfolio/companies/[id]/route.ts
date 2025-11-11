import { NextResponse } from "next/server";
import { requireSession } from "@/lib/services/session";
import { getServices } from "@/lib/services/get-services";
import { requirePermission } from "@/lib/utils/permissions";
import * as Sentry from "@sentry/nextjs";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: RouteParams) {
  return Sentry.startSpan(
    {
      op: "http.server",
      name: "GET /api/portfolio/companies/[id]",
    },
    async () => {
      try {
        const session = await requireSession();
        if (!session.organization?.id) {
          return NextResponse.json({ error: "No active organization" }, { status: 403 });
        }

        const { id } = await params;
        const context = {
          organizationId: session.organization.id,
          actorId: session.user.id,
        };

        const { customersService } = getServices(context);
        const company = await customersService.getCustomerCompanyWithRelations(context, id as any);

        if (!company) {
          return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
        }

        Sentry.startSpan(
          {
            op: "ui.action",
            name: "ui.portfolio.companies.detail.opened",
          },
          () => {
            Sentry.setContext("company_detail", {
              organizationId: context.organizationId,
              userId: context.actorId,
              companyId: id,
            });
          }
        );

        return NextResponse.json(company);
      } catch (error) {
        Sentry.captureException(error, {
          tags: { feature: "companies", action: "get_detail" },
        });
        return NextResponse.json(
          {
            error: error instanceof Error ? error.message : "Error al cargar empresa",
          },
          { status: 500 }
        );
      }
    }
  );
}

export async function PATCH(request: Request, { params }: RouteParams) {
  return Sentry.startSpan(
    {
      op: "http.server",
      name: "PATCH /api/portfolio/companies/[id]",
    },
    async () => {
      try {
        const session = await requireSession();
        if (!session.organization?.id) {
          return NextResponse.json({ error: "No active organization" }, { status: 403 });
        }

        requirePermission(session.user.role, "companies:update");

        const { id } = await params;
        const context = {
          organizationId: session.organization.id,
          actorId: session.user.id,
        };

        const body = await request.json();
        const { customersService } = getServices(context);
        
        // Track which fields changed
        const fieldsChanged = Object.keys(body).filter(key => body[key] !== undefined);

        const company = await customersService.updateCustomerCompany(context, id as any, body);

        Sentry.startSpan(
          {
            op: "ui.action",
            name: "ui.portfolio.companies.updated",
          },
          () => {
            Sentry.setContext("company_updated", {
              organizationId: context.organizationId,
              userId: context.actorId,
              companyId: id,
              fieldsChanged,
            });
          }
        );

        return NextResponse.json(company);
      } catch (error) {
        Sentry.captureException(error, {
          tags: { feature: "companies", action: "update" },
        });
        return NextResponse.json(
          {
            error: error instanceof Error ? error.message : "Error al actualizar empresa",
          },
          { status: error instanceof Error && error.message.includes("permiso") ? 403 : 400 }
        );
      }
    }
  );
}

