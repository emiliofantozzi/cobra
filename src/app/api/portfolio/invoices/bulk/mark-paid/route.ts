import { NextResponse } from "next/server";
import { requireSession } from "@/lib/services/session";
import { getServices } from "@/lib/services/get-services";
import { requirePermission } from "@/lib/utils/permissions";
import * as Sentry from "@sentry/nextjs";

export async function POST(request: Request) {
  return Sentry.startSpan(
    {
      op: "http.server",
      name: "POST /api/portfolio/invoices/bulk/mark-paid",
    },
    async () => {
      try {
        const session = await requireSession();
        if (!session.organization?.id) {
          return NextResponse.json({ error: "No active organization" }, { status: 403 });
        }

        requirePermission(session.user.role, "invoices:mark_paid");

        const context = {
          organizationId: session.organization.id,
          actorId: session.user.id,
        };

        const body = await request.json();
        const { invoiceIds, paymentReference } = body;

        if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
          return NextResponse.json(
            { error: "invoiceIds debe ser un array no vacío" },
            { status: 400 }
          );
        }

        const { invoicesService } = getServices(context);
        const updated = await invoicesService.bulkMarkAsPaid(
          context,
          invoiceIds,
          paymentReference
        );

        Sentry.startSpan(
          {
            op: "ui.action",
            name: "ui.portfolio.invoices.bulk_marked_paid",
          },
          () => {
            Sentry.setContext("invoices_bulk_marked_paid", {
              organizationId: context.organizationId,
              userId: context.actorId,
              count: invoiceIds.length,
              invoiceIds,
            });
          }
        );

        return NextResponse.json({ updated: updated.length, invoices: updated });
      } catch (error) {
        Sentry.captureException(error, {
          tags: { feature: "invoices", action: "bulk_mark_paid" },
        });
        return NextResponse.json(
          {
            error: error instanceof Error ? error.message : "Error al marcar facturas como pagadas",
          },
          { status: 400 }
        );
      }
    }
  );
}

