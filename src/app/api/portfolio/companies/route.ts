import { NextResponse } from "next/server";
import { requireSession } from "@/lib/services/session";
import { getServices } from "@/lib/services/get-services";
import { requirePermission } from "@/lib/utils/permissions";
import * as Sentry from "@sentry/nextjs";

export async function GET(request: Request) {
  return Sentry.startSpan(
    {
      op: "http.server",
      name: "GET /api/portfolio/companies",
    },
    async () => {
      try {
        const session = await requireSession();
        if (!session.organization?.id) {
          return NextResponse.json({ error: "No active organization" }, { status: 403 });
        }

        const context = {
          organizationId: session.organization.id,
          actorId: session.user.id,
        };

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status")?.split(",").filter(Boolean) as any;
        const search = searchParams.get("search") || undefined;
        const limit = parseInt(searchParams.get("limit") || "50", 10);
        const cursor = searchParams.get("cursor") || undefined;
        const sortBy = (searchParams.get("sortBy") || "createdAt") as "name" | "createdAt";
        const sortDirection = (searchParams.get("sortDirection") || "desc") as "asc" | "desc";

        const { customersService } = getServices(context);
        const result = await customersService.listCustomerCompanies(context, {
          status,
          search,
          pagination: { limit, cursor },
          sortBy,
          sortDirection,
        });

        Sentry.startSpan(
          {
            op: "ui.action",
            name: "ui.portfolio.companies.list.loaded",
          },
          () => {
            Sentry.setContext("companies_list", {
              organizationId: context.organizationId,
              count: result.data.length,
              filters: { status, search },
              sort: { sortBy, sortDirection },
            });
          }
        );

        return NextResponse.json(result);
      } catch (error) {
        Sentry.captureException(error, {
          tags: { feature: "companies", action: "list" },
        });
        return NextResponse.json(
          {
            error: error instanceof Error ? error.message : "Error al cargar empresas",
          },
          { status: 500 }
        );
      }
    }
  );
}

export async function POST(request: Request) {
  return Sentry.startSpan(
    {
      op: "http.server",
      name: "POST /api/portfolio/companies",
    },
    async () => {
      try {
        const session = await requireSession();
        if (!session.organization?.id) {
          return NextResponse.json({ error: "No active organization" }, { status: 403 });
        }

        requirePermission(session.user.role, "companies:create");

        const context = {
          organizationId: session.organization.id,
          actorId: session.user.id,
        };

        const body = await request.json();
        const { customersService } = getServices(context);
        const company = await customersService.createCustomerCompany(context, {
          ...body,
          organizationId: context.organizationId,
        });

        Sentry.startSpan(
          {
            op: "ui.action",
            name: "ui.portfolio.companies.created",
          },
          () => {
            Sentry.setContext("company_created", {
              organizationId: context.organizationId,
              userId: context.actorId,
              companyId: company.id,
              name: company.name,
              hasTaxId: !!company.taxId,
            });
          }
        );

        return NextResponse.json(company, { status: 201 });
      } catch (error) {
        Sentry.captureException(error, {
          tags: { feature: "companies", action: "create" },
        });
        return NextResponse.json(
          {
            error: error instanceof Error ? error.message : "Error al crear empresa",
          },
          { status: error instanceof Error && error.message.includes("permiso") ? 403 : 400 }
        );
      }
    }
  );
}

