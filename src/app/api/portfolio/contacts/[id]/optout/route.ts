import { NextResponse } from "next/server";
import { requireSession } from "@/lib/services/session";
import { getServices } from "@/lib/services/get-services";
import { requirePermission } from "@/lib/utils/permissions";
import * as Sentry from "@sentry/nextjs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return Sentry.startSpan(
    {
      op: "http.server",
      name: "POST /api/portfolio/contacts/[id]/optout",
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

        requirePermission(session.user.role, "contacts:manage_optout");

        const { contactsService } = getServices(context);
        const body = await request.json();

        if (!body.channel || !["email", "whatsapp"].includes(body.channel)) {
          return NextResponse.json({ error: "Invalid channel. Must be 'email' or 'whatsapp'" }, { status: 400 });
        }

        if (typeof body.optedOut !== "boolean") {
          return NextResponse.json({ error: "optedOut must be a boolean" }, { status: 400 });
        }

        const contact = await contactsService.setContactOptOut(
          context,
          id as any,
          body.channel,
          body.optedOut,
        );

        Sentry.startSpan(
          {
            op: "ui.action",
            name: "ui.portfolio.contacts.optout.changed",
          },
          () => {
            Sentry.setContext("contact_optout_changed", {
              organizationId: context.organizationId,
              userId: context.actorId,
              contactId: id,
              channel: body.channel,
              optedOut: body.optedOut,
            });
          },
        );

        return NextResponse.json(contact);
      } catch (error) {
        console.error("Error updating contact opt-out:", error);
        Sentry.captureException(error, {
          tags: { feature: "contacts", action: "optout" },
        });
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Internal server error" },
          { status: 400 },
        );
      }
    },
  );
}

