import { NextResponse } from "next/server";
import { requireSession } from "@/lib/services/session";
import { getServices } from "@/lib/services/get-services";
import { requirePermission } from "@/lib/utils/permissions";
import * as Sentry from "@sentry/nextjs";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: RouteParams) {
  return Sentry.startSpan(
    {
      op: "http.server",
      name: "PATCH /api/portfolio/invoices/[id]/expected-date",
    },
    async () => {
      try {
        const session = await requireSession();
        if (!session.organization?.id) {
          return NextResponse.json({ error: "No active organization" }, { status: 403 });
        }

        requirePermission(session.user.role, "invoices:update_dates");

        const { id } = await params;
        const context = {
          organizationId: session.organization.id,
          actorId: session.user.id,
        };

        const body = await request.json();
        const { expectedPaymentDate, dateOrigin, reason } = body;

        if (expectedPaymentDate === undefined) {
          return NextResponse.json(
            { error: "expectedPaymentDate es requerido" },
            { status: 400 }
          );
        }

        if (expectedPaymentDate !== null && !dateOrigin) {
          return NextResponse.json(
            { error: "dateOrigin es requerido cuando se establece expectedPaymentDate" },
            { status: 400 }
          );
        }

        const { invoicesService } = getServices(context);
        const invoice = await invoicesService.getInvoice(context, id as any);
        
        if (!invoice) {
          return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
        }

        const previousDate = invoice.expectedPaymentDate;
        const updated = await invoicesService.updateExpectedPaymentDate(
          context,
          id as any,
          expectedPaymentDate ? new Date(expectedPaymentDate) : null,
          dateOrigin || null,
          reason,
          context.actorId
        );

        Sentry.startSpan(
          {
            op: "ui.action",
            name: "ui.portfolio.invoices.expected_date.set",
          },
          () => {
            Sentry.setContext("invoice_expected_date_set", {
              organizationId: context.organizationId,
              userId: context.actorId,
              invoiceId: id,
              previousDate: previousDate?.toISOString(),
              newDate: updated.expectedPaymentDate?.toISOString(),
              dateOrigin,
            });
          }
        );

        return NextResponse.json(updated);
      } catch (error) {
        Sentry.captureException(error, {
          tags: { feature: "invoices", action: "update_expected_date" },
        });
        return NextResponse.json(
          {
            error: error instanceof Error ? error.message : "Error al actualizar fecha esperada",
          },
          { status: 400 }
        );
      }
    }
  );
}

