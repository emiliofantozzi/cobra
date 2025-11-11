import { redirect } from "next/navigation";
import { requireSession } from "@/lib/services/session";
import { getActiveOrganization, getUserOrganizations } from "@/lib/services/organizations";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { AppLayoutClient } from "@/components/layout/app-layout-client";

type AppLayoutProps = {
  children: React.ReactNode;
};

export default async function AppLayout({ children }: AppLayoutProps) {
  const session = await requireSession({ redirectTo: "/" });

  // Si no tiene organización activa, redirigir a onboarding
  const activeOrg = await getActiveOrganization(session.user.id);
  if (!activeOrg) {
    redirect("/onboarding/organization");
  }

  // Obtener todas las organizaciones del usuario para el selector
  const organizations = await getUserOrganizations(session.user.id);

  return (
    <AppLayoutClient>
      <div className="flex min-h-screen bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <AppHeader
            user={session.user}
            organization={session.organization}
            organizations={organizations}
          />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </AppLayoutClient>
  );
}

