import { NextResponse } from "next/server";
import { requireSession } from "@/lib/services/session";
import { setActiveOrganization } from "@/lib/services/organizations";

export async function POST(request: Request) {
  try {
    const session = await requireSession({ redirectTo: "/" });
    const formData = await request.formData();
    const organizationId = formData.get("organizationId") as string;

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId is required" },
        { status: 400 }
      );
    }

    await setActiveOrganization(session.user.id, organizationId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error switching organization:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error al cambiar de organización",
      },
      { status: 500 }
    );
  }
}

