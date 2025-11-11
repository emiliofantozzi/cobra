import { NextResponse } from "next/server";
import { requireSession } from "@/lib/services/session";
import { getServices } from "@/lib/services/get-services";
import { requirePermission } from "@/lib/utils/permissions";
import * as Sentry from "@sentry/nextjs";

export async function PATCH(request: Request) {
  return Sentry.startSpan(
    {
      op: "http.server",
      name: "PATCH /api/portfolio/invoices/bulk/expected-dates",
    },
    async () => {
      try {
        const session = await requireSession();
        if (!session.organization?.id) {
          return NextResponse.json({ error: "No active organization" }, { status: 403 });
        }

        requirePermission(session.user.role, "invoices:update_dates");

        const context = {
          organizationId: session.organization.id,
          actorId: session.user.id,
        };

        const body = await request.json();
        const { invoiceIds, expectedPaymentDate, dateOrigin, reason } = body;

        if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
          return NextResponse.json(
            { error: "invoiceIds debe ser un array no vacío" },
            { status: 400 }
          );
        }

        if (!expectedPaymentDate) {
          return NextResponse.json(
            { error: "expectedPaymentDate es requerido" },
            { status: 400 }
          );
        }

        if (!dateOrigin) {
          return NextResponse.json(
            { error: "dateOrigin es requerido" },
            { status: 400 }
          );
        }

        const { invoicesService } = getServices(context);
        const updated = await invoicesService.bulkUpdateExpectedDates(
          context,
          invoiceIds,
          new Date(expectedPaymentDate),
          dateOrigin,
          reason,
          context.actorId
        );

        Sentry.startSpan(
          {
            op: "ui.action",
            name: "ui.portfolio.invoices.bulk_expected_dates.updated",
          },
          () => {
            Sentry.setContext("invoices_bulk_expected_dates", {
              organizationId: context.organizationId,
              userId: context.actorId,
              count: invoiceIds.length,
              invoiceIds,
              newDate: expectedPaymentDate,
              dateOrigin,
            });
          }
        );

        return NextResponse.json({ updated: updated.length, invoices: updated });
      } catch (error) {
        Sentry.captureException(error, {
          tags: { feature: "invoices", action: "bulk_update_expected_dates" },
        });
        return NextResponse.json(
          {
            error: error instanceof Error ? error.message : "Error al actualizar fechas esperadas",
          },
          { status: 400 }
        );
      }
    }
  );
}

