import { NextResponse } from "next/server";
import { requireSession } from "@/lib/services/session";
import { getServices } from "@/lib/services/get-services";
import { requirePermission } from "@/lib/utils/permissions";
import * as Sentry from "@sentry/nextjs";

export async function GET(request: Request) {
  return Sentry.startSpan(
    {
      op: "http.server",
      name: "GET /api/portfolio/invoices",
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
        const currency = searchParams.get("currency") || undefined;
        const dateOrigin = searchParams.get("dateOrigin") || undefined;
        const chip = searchParams.get("chip") || undefined;
        const limit = parseInt(searchParams.get("limit") || "50", 10);
        const cursor = searchParams.get("cursor") || undefined;
        const sortBy = (searchParams.get("sortBy") || "dueDate") as "dueDate" | "amount" | "expectedPaymentDate" | "status" | "createdAt";
        const sortDirection = (searchParams.get("sortDirection") || "asc") as "asc" | "desc";

        const { invoicesService } = getServices(context);
        
        // Handle chip filters
        let queryParams: any = {
          status,
          search,
          customerCompanyId: customerCompanyId as any,
          dateOrigin,
          pagination: { limit, cursor },
        };

        if (chip) {
          const today = new Date();
          switch (chip) {
            case "sin_fecha":
              queryParams.expectedPaymentDateFrom = null;
              queryParams.expectedPaymentDateTo = null;
              break;
            case "con_fecha":
              // Already handled by dateOrigin filter
              break;
            case "vence_hoy":
              const startOfDay = new Date(today);
              startOfDay.setHours(0, 0, 0, 0);
              const endOfDay = new Date(today);
              endOfDay.setHours(23, 59, 59, 999);
              // Filter by dueDate range - handled by service method
              const venceHoy = await invoicesService.getInvoicesByChip(context, "vence_hoy", today);
              return NextResponse.json({
                data: venceHoy,
                nextCursor: null,
                totalCount: venceHoy.length,
              });
            case "vencidas":
              const vencidas = await invoicesService.getInvoicesByChip(context, "vencidas", today);
              return NextResponse.json({
                data: vencidas,
                nextCursor: null,
                totalCount: vencidas.length,
              });
            case "con_promesa_hoy":
              const conPromesaHoy = await invoicesService.getInvoicesByChip(context, "con_promesa_hoy", today);
              return NextResponse.json({
                data: conPromesaHoy,
                nextCursor: null,
                totalCount: conPromesaHoy.length,
              });
            case "promesa_incumplida":
              const promesaIncumplida = await invoicesService.getInvoicesByChip(context, "promesa_incumplida", today);
              return NextResponse.json({
                data: promesaIncumplida,
                nextCursor: null,
                totalCount: promesaIncumplida.length,
              });
            case "pagadas":
              queryParams.status = ["PAID"];
              break;
          }
        }

        const result = await invoicesService.listInvoices(context, queryParams);

        // Apply sorting (simplified - in production, this should be done in the repository)
        if (sortBy !== "createdAt") {
          result.data.sort((a, b) => {
            let aVal: any = a[sortBy];
            let bVal: any = b[sortBy];
            
            if (sortBy === "amount") {
              aVal = a.amount;
              bVal = b.amount;
            } else if (sortBy === "dueDate" || sortBy === "expectedPaymentDate") {
              aVal = a[sortBy]?.getTime() || 0;
              bVal = b[sortBy]?.getTime() || 0;
            }
            
            if (sortDirection === "asc") {
              return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
            } else {
              return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
            }
          });
        }

        Sentry.startSpan(
          {
            op: "ui.action",
            name: "ui.portfolio.invoices.list.loaded",
          },
          () => {
            Sentry.setContext("invoices_list", {
              organizationId: context.organizationId,
              count: result.data.length,
              filters: { status, search, customerCompanyId, currency, dateOrigin },
              sort: { sortBy, sortDirection },
            });
          }
        );

        return NextResponse.json(result);
      } catch (error) {
        Sentry.captureException(error, {
          tags: { feature: "invoices", action: "list" },
        });
        return NextResponse.json(
          {
            error: error instanceof Error ? error.message : "Error al cargar facturas",
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
      name: "POST /api/portfolio/invoices",
    },
    async () => {
      try {
        const session = await requireSession();
        if (!session.organization?.id) {
          return NextResponse.json({ error: "No active organization" }, { status: 403 });
        }

        requirePermission(session.user.role, "invoices:create");

        const context = {
          organizationId: session.organization.id,
          actorId: session.user.id,
        };

        const body = await request.json();
        const { invoicesService } = getServices(context);
        
        // Convert date strings to Date objects
        const invoiceDraft = {
          ...body,
          organizationId: context.organizationId,
          issueDate: new Date(body.issueDate),
          dueDate: new Date(body.dueDate),
          expectedPaymentDate: body.expectedPaymentDate ? new Date(body.expectedPaymentDate) : undefined,
          paymentPromiseDate: body.paymentPromiseDate ? new Date(body.paymentPromiseDate) : undefined,
        };
        
        const invoice = await invoicesService.createInvoice(context, invoiceDraft);

        Sentry.startSpan(
          {
            op: "ui.action",
            name: "ui.portfolio.invoices.created",
          },
          () => {
            Sentry.setContext("invoice_created", {
              organizationId: context.organizationId,
              userId: context.actorId,
              invoiceId: invoice.invoice.id,
              customerCompanyId: invoice.invoice.customerCompanyId,
              amount: invoice.invoice.amount,
              currency: invoice.invoice.currency,
              status: invoice.invoice.status,
            });
          }
        );

        return NextResponse.json(invoice.invoice, { status: 201 });
      } catch (error) {
        Sentry.captureException(error, {
          tags: { feature: "invoices", action: "create" },
        });
        return NextResponse.json(
          {
            error: error instanceof Error ? error.message : "Error al crear factura",
          },
          { status: error instanceof Error && error.message.includes("permiso") ? 403 : 400 }
        );
      }
    }
  );
}

