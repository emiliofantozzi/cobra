import { NextResponse } from "next/server";
import { requireSession } from "@/lib/services/session";
import { getServices } from "@/lib/services/get-services";
import { requirePermission } from "@/lib/utils/permissions";
import * as Sentry from "@sentry/nextjs";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: RouteParams) {
  return Sentry.startSpan(
    {
      op: "http.server",
      name: "GET /api/portfolio/invoices/[id]",
    },
    async () => {
      try {
        const session = await requireSession();
        if (!session.organization?.id) {
          return NextResponse.json({ error: "No active organization" }, { status: 403 });
        }

        const { id } = await params;
        const context = {
          organizationId: session.organization.id,
          actorId: session.user.id,
        };

        const { invoicesService } = getServices(context);
        const invoice = await invoicesService.getInvoice(context, id as any);

        if (!invoice) {
          return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
        }

        Sentry.startSpan(
          {
            op: "ui.action",
            name: "ui.portfolio.invoices.opened",
          },
          () => {
            Sentry.setContext("invoice_opened", {
              organizationId: context.organizationId,
              userId: context.actorId,
              invoiceId: id,
            });
          }
        );

        return NextResponse.json(invoice);
      } catch (error) {
        Sentry.captureException(error, {
          tags: { feature: "invoices", action: "get_detail" },
        });
        return NextResponse.json(
          {
            error: error instanceof Error ? error.message : "Error al cargar factura",
          },
          { status: 500 }
        );
      }
    }
  );
}

export async function PATCH(request: Request, { params }: RouteParams) {
  return Sentry.startSpan(
    {
      op: "http.server",
      name: "PATCH /api/portfolio/invoices/[id]",
    },
    async () => {
      try {
        const session = await requireSession();
        if (!session.organization?.id) {
          return NextResponse.json({ error: "No active organization" }, { status: 403 });
        }

        requirePermission(session.user.role, "invoices:update");

        const { id } = await params;
        const context = {
          organizationId: session.organization.id,
          actorId: session.user.id,
        };

        const body = await request.json();
        const { invoicesService } = getServices(context);
        
        // Check if updating amount/currency (requires special permission)
        if (body.amount !== undefined || body.currency !== undefined) {
          requirePermission(session.user.role, "invoices:update_amount");
        }

        // Track which fields changed
        const fieldsChanged = Object.keys(body).filter(key => body[key] !== undefined);

        // Get current invoice to check status transition if status is being changed
        if (body.status !== undefined) {
          const currentInvoice = await invoicesService.getInvoice(context, id as any);
          if (currentInvoice && currentInvoice.status !== body.status) {
            requirePermission(session.user.role, "invoices:update_status");
          }
        }

        const invoice = await invoicesService.getInvoice(context, id as any);
        if (!invoice) {
          return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
        }

        // Convert date strings to Date objects if present
        const updateData: any = { ...body };
        if (body.issueDate) updateData.issueDate = new Date(body.issueDate);
        if (body.dueDate) updateData.dueDate = new Date(body.dueDate);
        if (body.expectedPaymentDate) updateData.expectedPaymentDate = new Date(body.expectedPaymentDate);
        if (body.paymentPromiseDate) updateData.paymentPromiseDate = new Date(body.paymentPromiseDate);
        if (body.nextActionAt) updateData.nextActionAt = new Date(body.nextActionAt);

        // Get invoice repository and update
        const { createInvoiceRepository } = await import("@/lib/repositories/invoice-repository");
        const invoiceRepository = createInvoiceRepository();
        const updated = await invoiceRepository.update(context, id as any, updateData);

        Sentry.startSpan(
          {
            op: "ui.action",
            name: "ui.portfolio.invoices.updated",
          },
          () => {
            Sentry.setContext("invoice_updated", {
              organizationId: context.organizationId,
              userId: context.actorId,
              invoiceId: id,
              fieldsChanged,
            });
          }
        );

        return NextResponse.json(updated);
      } catch (error) {
        Sentry.captureException(error, {
          tags: { feature: "invoices", action: "update" },
        });
        return NextResponse.json(
          {
            error: error instanceof Error ? error.message : "Error al actualizar factura",
          },
          { status: error instanceof Error && error.message.includes("permiso") ? 403 : 400 }
        );
      }
    }
  );
}

