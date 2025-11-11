import { NextResponse } from "next/server";
import { requireSession } from "@/lib/services/session";
import { getServices } from "@/lib/services/get-services";
import { requirePermission } from "@/lib/utils/permissions";
import type { ListContactsParams } from "@/lib/repositories/contact-repository";
import * as Sentry from "@sentry/nextjs";

export async function GET(request: Request) {
  return Sentry.startSpan(
    {
      op: "http.server",
      name: "GET /api/portfolio/contacts/export",
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

        requirePermission(session.user.role, "contacts:export");

        const { contactsService } = getServices(context);

    // Parse query params for filters
    const { searchParams } = new URL(request.url);
    const filters: Partial<ListContactsParams> = {};

    if (searchParams.get("customerCompanyId")) {
      filters.customerCompanyId = searchParams.get("customerCompanyId")!;
    }

    if (searchParams.get("search")) {
      filters.search = searchParams.get("search")!;
    }

    if (searchParams.get("optedOutEmail")) {
      filters.optedOutEmail = searchParams.get("optedOutEmail") === "true";
    }

    if (searchParams.get("optedOutWhatsapp")) {
      filters.optedOutWhatsapp = searchParams.get("optedOutWhatsapp") === "true";
    }

    if (searchParams.get("role")) {
      filters.role = searchParams.get("role")!;
    }

    if (searchParams.get("preferredChannel")) {
      filters.preferredChannel = searchParams.get("preferredChannel")!;
    }

        const csv = await contactsService.exportContactsCSV(context, filters);

        Sentry.startSpan(
          {
            op: "ui.action",
            name: "ui.portfolio.contacts.exported",
          },
          () => {
            Sentry.setContext("contact_exported", {
              organizationId: context.organizationId,
              userId: context.actorId,
              format: "csv",
              filters,
            });
          },
        );

        return new NextResponse(csv, {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="contactos-${new Date().toISOString().split("T")[0]}.csv"`,
          },
        });
      } catch (error) {
        console.error("Error exporting contacts:", error);
        Sentry.captureException(error, {
          tags: { feature: "contacts", action: "export" },
        });
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Internal server error" },
          { status: 500 },
        );
      }
    },
  );
}

