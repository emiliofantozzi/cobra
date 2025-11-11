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
      name: "POST /api/portfolio/invoices/[id]/promise",
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
        const { promiseDate, reason } = body;

        if (!promiseDate) {
          return NextResponse.json(
            { error: "promiseDate es requerido" },
            { status: 400 }
          );
        }

        const { invoicesService } = getServices(context);
        const updated = await invoicesService.recordPaymentPromise(
          context,
          id as any,
          new Date(promiseDate),
          reason
        );

        Sentry.startSpan(
          {
            op: "ui.action",
            name: "ui.portfolio.invoices.promise.set",
          },
          () => {
            Sentry.setContext("invoice_promise_set", {
              organizationId: context.organizationId,
              userId: context.actorId,
              invoiceId: id,
              promiseDate: updated.paymentPromiseDate?.toISOString(),
            });
          }
        );

        return NextResponse.json(updated);
      } catch (error) {
        Sentry.captureException(error, {
          tags: { feature: "invoices", action: "set_promise" },
        });
        return NextResponse.json(
          {
            error: error instanceof Error ? error.message : "Error al registrar promesa",
          },
          { status: 400 }
        );
      }
    }
  );
}

