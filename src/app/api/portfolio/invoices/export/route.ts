import { NextResponse } from "next/server";
import { requireSession } from "@/lib/services/session";
import { getServices } from "@/lib/services/get-services";
import * as Sentry from "@sentry/nextjs";

export async function GET(request: Request) {
  return Sentry.startSpan(
    {
      op: "http.server",
      name: "GET /api/portfolio/invoices/export",
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
        const customerCompanyId = searchParams.get("customerCompanyId") || undefined;

        const { invoicesService } = getServices(context);
        
        // Get all invoices matching filters (up to 10k)
        const result = await invoicesService.listInvoices(context, {
          status,
          search,
          customerCompanyId: customerCompanyId as any,
          pagination: { limit: 10000 },
        });

        // Generate CSV
        const headers = [
          "Número",
          "Empresa",
          "Monto",
          "Moneda",
          "Fecha Emisión",
          "Fecha Vencimiento",
          "Fecha Esperada",
          "Origen Fecha",
          "Promesa Pago",
          "Estado",
          "Días Vencimiento",
          "Próxima Acción",
          "Último Canal",
          "Último Resultado",
          "Notas",
        ];

        const rows = result.data.map((invoice) => {
          const daysToDue = Math.floor(
            (invoice.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          );

          return [
            invoice.number || "",
            invoice.customerCompany?.name || "",
            invoice.amount.toString(),
            invoice.currency,
            invoice.issueDate.toISOString().split("T")[0],
            invoice.dueDate.toISOString().split("T")[0],
            invoice.expectedPaymentDate?.toISOString().split("T")[0] || "",
            invoice.dateOrigin || "",
            invoice.paymentPromiseDate?.toISOString().split("T")[0] || "",
            invoice.status,
            daysToDue.toString(),
            invoice.nextActionAt?.toISOString().split("T")[0] || "",
            invoice.lastChannel || "",
            invoice.lastResult || "",
            invoice.notes || "",
          ];
        });

        const csvContent = [
          headers.join(","),
          ...rows.map((row) =>
            row.map((cell) => {
              const str = String(cell || "");
              // Escape quotes and wrap in quotes if contains comma, quote, or newline
              if (str.includes(",") || str.includes('"') || str.includes("\n")) {
                return `"${str.replace(/"/g, '""')}"`;
              }
              return str;
            }).join(",")
          ),
        ].join("\n");

        Sentry.startSpan(
          {
            op: "ui.action",
            name: "ui.portfolio.invoices.exported",
          },
          () => {
            Sentry.setContext("invoices_exported", {
              organizationId: context.organizationId,
              userId: context.actorId,
              count: result.data.length,
              filters: { status, search, customerCompanyId },
            });
          }
        );

        return new NextResponse(csvContent, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="facturas-${new Date().toISOString().split("T")[0]}.csv"`,
          },
        });
      } catch (error) {
        Sentry.captureException(error, {
          tags: { feature: "invoices", action: "export" },
        });
        return NextResponse.json(
          {
            error: error instanceof Error ? error.message : "Error al exportar facturas",
          },
          { status: 500 }
        );
      }
    }
  );
}

