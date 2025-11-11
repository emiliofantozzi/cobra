import { NextResponse } from "next/server";
import { requireSession } from "@/lib/services/session";
import { getServices } from "@/lib/services/get-services";
import { requirePermission } from "@/lib/utils/permissions";
import * as Sentry from "@sentry/nextjs";

export async function POST(request: Request) {
  return Sentry.startSpan(
    {
      op: "http.server",
      name: "POST /api/portfolio/contacts/bulk/optout",
    },
    async () => {
      try {
        const session = await requireSession();
        if (!session.organization?.id) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const context = {
          organizationId: session.organization.id,
          actorId: session.user.id,
        };

        requirePermission(session.user.role, "contacts:manage_optout");

        const { contactsService } = getServices(context);
        const body = await request.json();

        if (!Array.isArray(body.contactIds) || body.contactIds.length === 0) {
          return NextResponse.json({ error: "contactIds must be a non-empty array" }, { status: 400 });
        }

        if (!body.channel || !["email", "whatsapp"].includes(body.channel)) {
          return NextResponse.json({ error: "Invalid channel. Must be 'email' or 'whatsapp'" }, { status: 400 });
        }

        if (typeof body.optedOut !== "boolean") {
          return NextResponse.json({ error: "optedOut must be a boolean" }, { status: 400 });
        }

        const results = await Promise.allSettled(
          body.contactIds.map((contactId: string) =>
            contactsService.setContactOptOut(context, contactId as any, body.channel, body.optedOut),
          ),
        );

        const successful = results.filter((r) => r.status === "fulfilled").length;
        const failed = results.filter((r) => r.status === "rejected").length;

        Sentry.startSpan(
          {
            op: "ui.action",
            name: "ui.portfolio.contacts.bulk_optout_changed",
          },
          () => {
            Sentry.setContext("contact_bulk_optout_changed", {
              organizationId: context.organizationId,
              userId: context.actorId,
              count: successful,
              contactIds: body.contactIds,
              channel: body.channel,
              optedOut: body.optedOut,
            });
          },
        );

        return NextResponse.json({
          success: true,
          updated: successful,
          failed,
          total: body.contactIds.length,
        });
      } catch (error) {
        console.error("Error bulk updating contact opt-out:", error);
        Sentry.captureException(error, {
          tags: { feature: "contacts", action: "bulk_optout" },
        });
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Internal server error" },
          { status: 400 },
        );
      }
    },
  );
}

