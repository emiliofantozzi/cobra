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
      name: "POST /api/portfolio/invoices/[id]/mark-paid",
    },
    async () => {
      try {
        const session = await requireSession();
        if (!session.organization?.id) {
          return NextResponse.json({ error: "No active organization" }, { status: 403 });
        }

        requirePermission(session.user.role, "invoices:mark_paid");

        const { id } = await params;
        const context = {
          organizationId: session.organization.id,
          actorId: session.user.id,
        };

        const body = await request.json();
        const { paymentReference } = body;

        const { invoicesService } = getServices(context);
        const invoice = await invoicesService.getInvoice(context, id as any);
        
        if (!invoice) {
          return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
        }

        const previousStatus = invoice.status;
        const updated = await invoicesService.markInvoiceAsPaid(
          context,
          id as any,
          paymentReference
        );

        Sentry.startSpan(
          {
            op: "ui.action",
            name: "ui.portfolio.invoices.marked_paid",
          },
          () => {
            Sentry.setContext("invoice_marked_paid", {
              organizationId: context.organizationId,
              userId: context.actorId,
              invoiceId: id,
              amount: updated.amount,
              currency: updated.currency,
              paymentReference,
            });
          }
        );

        // Also track status change
        Sentry.startSpan(
          {
            op: "ui.action",
            name: "ui.portfolio.invoices.status_changed",
          },
          () => {
            Sentry.setContext("invoice_status_changed", {
              organizationId: context.organizationId,
              userId: context.actorId,
              invoiceId: id,
              previousStatus,
              newStatus: "PAID",
            });
          }
        );

        return NextResponse.json(updated);
      } catch (error) {
        Sentry.captureException(error, {
          tags: { feature: "invoices", action: "mark_paid" },
        });
        return NextResponse.json(
          {
            error: error instanceof Error ? error.message : "Error al marcar factura como pagada",
          },
          { status: 400 }
        );
      }
    }
  );
}

