import { NextResponse } from "next/server";
import { requireSession } from "@/lib/services/session";
import { getServices } from "@/lib/services/get-services";
import { requirePermission } from "@/lib/utils/permissions";
import * as Sentry from "@sentry/nextjs";

export async function GET(request: Request) {
  return Sentry.startSpan(
    {
      op: "http.server",
      name: "GET /api/portfolio/companies/export",
    },
    async () => {
      try {
        const session = await requireSession();
        if (!session.organization?.id) {
          return NextResponse.json({ error: "No active organization" }, { status: 403 });
        }

        requirePermission(session.user.role, "companies:export");

        const context = {
          organizationId: session.organization.id,
          actorId: session.user.id,
        };

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status")?.split(",").filter(Boolean) as any;
        const search = searchParams.get("search") || undefined;

        const { customersService } = getServices(context);
        
        // Get all companies (no pagination for export)
        const result = await customersService.listCustomerCompanies(context, {
          status,
          search,
          pagination: { limit: 10000 }, // Large limit for export
        });

        // Convert to CSV
        const headers = ["Nombre", "Razón Social", "RUT/Tax ID", "Estado", "Industria", "Sitio Web", "Creada"];
        const rows = result.data.map((company) => [
          company.name,
          company.legalName || "",
          company.taxId || "",
          company.status,
          company.industry || "",
          company.website || "",
          company.createdAt.toISOString().split("T")[0],
        ]);

        const csvContent = [
          headers.join(","),
          ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
        ].join("\n");

        Sentry.startSpan(
          {
            op: "ui.action",
            name: "ui.portfolio.companies.exported",
          },
          () => {
            Sentry.setContext("companies_export", {
              organizationId: context.organizationId,
              userId: context.actorId,
              format: "csv",
              count: result.data.length,
            });
          }
        );

        return new NextResponse(csvContent, {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="empresas-${new Date().toISOString().split("T")[0]}.csv"`,
          },
        });
      } catch (error) {
        Sentry.captureException(error, {
          tags: { feature: "companies", action: "export" },
        });
        return NextResponse.json(
          {
            error: error instanceof Error ? error.message : "Error al exportar empresas",
          },
          { status: error instanceof Error && error.message.includes("permiso") ? 403 : 500 }
        );
      }
    }
  );
}

