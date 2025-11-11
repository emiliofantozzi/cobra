import { NextResponse } from "next/server";
import { requireSession } from "@/lib/services/session";
import { getServices } from "@/lib/services/get-services";
import { requirePermission } from "@/lib/utils/permissions";
import * as Sentry from "@sentry/nextjs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return Sentry.startSpan(
    {
      op: "http.server",
      name: "GET /api/portfolio/contacts/[id]",
    },
    async () => {
      try {
        const session = await requireSession();
        if (!session.organization?.id) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const context = {
          organizationId: session.organization.id,
          actorId: session.user.id,
        };

        const { contactsService } = getServices(context);
        const contact = await contactsService.getContact(context, id as any);

        if (!contact) {
          return NextResponse.json({ error: "Contact not found" }, { status: 404 });
        }

        Sentry.startSpan(
          {
            op: "ui.action",
            name: "ui.portfolio.contacts.opened",
          },
          () => {
            Sentry.setContext("contact_opened", {
              organizationId: context.organizationId,
              userId: context.actorId,
              contactId: contact.id,
            });
          },
        );

        return NextResponse.json(contact);
      } catch (error) {
        console.error("Error getting contact:", error);
        Sentry.captureException(error, {
          tags: { feature: "contacts", action: "get" },
        });
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Internal server error" },
          { status: 500 },
        );
      }
    },
  );
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return Sentry.startSpan(
    {
      op: "http.server",
      name: "PATCH /api/portfolio/contacts/[id]",
    },
    async () => {
      try {
        const session = await requireSession();
        if (!session.organization?.id) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const context = {
          organizationId: session.organization.id,
          actorId: session.user.id,
        };

        requirePermission(session.user.role, "contacts:update");

        const { contactsService } = getServices(context);
        const body = await request.json();

        const contact = await contactsService.updateContact(context, id as any, body);

        Sentry.startSpan(
          {
            op: "ui.action",
            name: "ui.portfolio.contacts.updated",
          },
          () => {
            Sentry.setContext("contact_updated", {
              organizationId: context.organizationId,
              userId: context.actorId,
              contactId: contact.id,
              fieldsChanged: Object.keys(body),
            });
          },
        );

        return NextResponse.json(contact);
      } catch (error) {
        console.error("Error updating contact:", error);
        Sentry.captureException(error, {
          tags: { feature: "contacts", action: "update" },
        });
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Internal server error" },
          { status: 400 },
        );
      }
    },
  );
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return Sentry.startSpan(
    {
      op: "http.server",
      name: "DELETE /api/portfolio/contacts/[id]",
    },
    async () => {
      try {
        const session = await requireSession();
        if (!session.organization?.id) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const context = {
          organizationId: session.organization.id,
          actorId: session.user.id,
        };

        requirePermission(session.user.role, "contacts:delete");

        const { contactsService } = getServices(context);
        const contact = await contactsService.getContact(context, id as any);
        await contactsService.deleteContact(context, id as any);

        Sentry.startSpan(
          {
            op: "ui.action",
            name: "ui.portfolio.contacts.deleted",
          },
          () => {
            Sentry.setContext("contact_deleted", {
              organizationId: context.organizationId,
              userId: context.actorId,
              contactId: id,
              customerCompanyId: contact?.customerCompanyId,
            });
          },
        );

        return NextResponse.json({ success: true });
      } catch (error) {
        console.error("Error deleting contact:", error);
        Sentry.captureException(error, {
          tags: { feature: "contacts", action: "delete" },
        });
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Internal server error" },
          { status: 400 },
        );
      }
    },
  );
}

