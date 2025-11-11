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
      name: "GET /api/portfolio/contacts",
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

        const { contactsService } = getServices(context);

    // Parse query params
    const { searchParams } = new URL(request.url);
    const params: ListContactsParams = {};

    if (searchParams.get("customerCompanyId")) {
      params.customerCompanyId = searchParams.get("customerCompanyId")!;
    }

    if (searchParams.get("search")) {
      params.search = searchParams.get("search")!;
    }

    if (searchParams.get("hasOptedOut")) {
      params.hasOptedOut = searchParams.get("hasOptedOut") === "true";
    }

    if (searchParams.get("optedOutEmail")) {
      params.optedOutEmail = searchParams.get("optedOutEmail") === "true";
    }

    if (searchParams.get("optedOutWhatsapp")) {
      params.optedOutWhatsapp = searchParams.get("optedOutWhatsapp") === "true";
    }

    if (searchParams.get("role")) {
      params.role = searchParams.get("role")!;
    }

    if (searchParams.get("preferredChannel")) {
      params.preferredChannel = searchParams.get("preferredChannel")!;
    }

    if (searchParams.get("hasWhatsapp")) {
      params.hasWhatsapp = searchParams.get("hasWhatsapp") === "true";
    }

    if (searchParams.get("hasEmail")) {
      params.hasEmail = searchParams.get("hasEmail") === "true";
    }

    if (searchParams.get("isPrimary")) {
      params.isPrimary = searchParams.get("isPrimary") === "true";
    }

    if (searchParams.get("isBillingContact")) {
      params.isBillingContact = searchParams.get("isBillingContact") === "true";
    }

    // Pagination
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 50;
    const cursor = searchParams.get("cursor") || undefined;
    params.pagination = { limit, cursor };

    // Order by
    if (searchParams.get("orderBy")) {
      params.orderBy = searchParams.get("orderBy") as ListContactsParams["orderBy"];
    }
    if (searchParams.get("orderDirection")) {
      params.orderDirection = searchParams.get("orderDirection") as "asc" | "desc";
    }

        const result = await contactsService.listContacts(context, params);

        Sentry.startSpan(
          {
            op: "ui.action",
            name: "ui.portfolio.contacts.list.loaded",
          },
          () => {
            Sentry.setContext("contacts_list", {
              organizationId: context.organizationId,
              count: result.data.length,
              totalCount: result.totalCount,
              filters: params,
            });
          },
        );

        return NextResponse.json(result);
      } catch (error) {
        console.error("Error listing contacts:", error);
        Sentry.captureException(error, {
          tags: { feature: "contacts", action: "list" },
        });
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Internal server error" },
          { status: 500 },
        );
      }
    },
  );
}

export async function POST(request: Request) {
  return Sentry.startSpan(
    {
      op: "http.server",
      name: "POST /api/portfolio/contacts",
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

        requirePermission(session.user.role, "contacts:create");

        const { contactsService } = getServices(context);
        const body = await request.json();

        const contact = await contactsService.createContact(context, {
          ...body,
          organizationId: context.organizationId,
        });

        Sentry.startSpan(
          {
            op: "ui.action",
            name: "ui.portfolio.contacts.created",
          },
          () => {
            Sentry.setContext("contact_created", {
              organizationId: context.organizationId,
              userId: context.actorId,
              contactId: contact.id,
              customerCompanyId: contact.customerCompanyId,
              role: contact.role,
              channels: {
                email: !!contact.email,
                whatsapp: !!contact.whatsappNumber,
                phone: !!contact.phoneNumber,
              },
            });
          },
        );

        return NextResponse.json(contact, { status: 201 });
      } catch (error) {
        console.error("Error creating contact:", error);
        Sentry.captureException(error, {
          tags: { feature: "contacts", action: "create" },
        });
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Internal server error" },
          { status: 400 },
        );
      }
    },
  );
}

