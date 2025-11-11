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
      name: "POST /api/portfolio/invoices/[id]/cancel",
    },
    async () => {
      try {
        const session = await requireSession();
        if (!session.organization?.id) {
          return NextResponse.json({ error: "No active organization" }, { status: 403 });
        }

        requirePermission(session.user.role, "invoices:cancel");

        const { id } = await params;
        const context = {
          organizationId: session.organization.id,
          actorId: session.user.id,
        };

        const body = await request.json();
        const { reason } = body;

        if (!reason || reason.trim().length === 0) {
          return NextResponse.json(
            { error: "El motivo de cancelación es requerido" },
            { status: 400 }
          );
        }

        const { invoicesService } = getServices(context);
        const invoice = await invoicesService.getInvoice(context, id as any);
        
        if (!invoice) {
          return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
        }

        const previousStatus = invoice.status;
        const updated = await invoicesService.cancelInvoice(
          context,
          id as any,
          reason
        );

        Sentry.startSpan(
          {
            op: "ui.action",
            name: "ui.portfolio.invoices.cancelled",
          },
          () => {
            Sentry.setContext("invoice_cancelled", {
              organizationId: context.organizationId,
              userId: context.actorId,
              invoiceId: id,
              reason,
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
              newStatus: "CANCELLED",
            });
          }
        );

        return NextResponse.json(updated);
      } catch (error) {
        Sentry.captureException(error, {
          tags: { feature: "invoices", action: "cancel" },
        });
        return NextResponse.json(
          {
            error: error instanceof Error ? error.message : "Error al cancelar factura",
          },
          { status: 400 }
        );
      }
    }
  );
}

