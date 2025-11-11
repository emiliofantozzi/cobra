import { NextResponse } from "next/server";
import { requireSession } from "@/lib/services/session";
import { getServices } from "@/lib/services/get-services";
import * as Sentry from "@sentry/nextjs";

export async function GET(request: Request) {
  return Sentry.startSpan(
    {
      op: "http.server",
      name: "GET /api/portfolio/invoices/chips",
    },
    async () => {
      try {
        const session = await requireSession();
        if (!session.organization?.id) {
          return NextResponse.json({ error: "No active organization" }, { status: 403 });
        }

        const context = {
          organizationId: session.organization.id,
          actorId: session.user.id,
        };

        const { invoicesService } = getServices(context);
        const counts = await invoicesService.getChipCounts(context);

        return NextResponse.json(counts);
      } catch (error) {
        Sentry.captureException(error, {
          tags: { feature: "invoices", action: "get_chip_counts" },
        });
        return NextResponse.json(
          {
            error: error instanceof Error ? error.message : "Error al cargar contadores",
          },
          { status: 500 }
        );
      }
    }
  );
}

