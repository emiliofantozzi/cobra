"use client";

import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { OrganizationSwitcher } from "@/components/layout/organization-switcher";

type AppHeaderProps = {
  user: {
    name?: string | null;
    email?: string | null;
  };
  organization?: {
    id?: string;
    name?: string | null;
  } | null;
  organizations?: Array<{
    id: string;
    name: string;
    isActive: boolean;
  }>;
};

export function AppHeader({ user, organization, organizations = [] }: AppHeaderProps) {
  const router = useRouter();

  async function handleSignOut() {
    try {
      // Call the sign out API route (NextAuth v5 handles this automatically)
      const response = await fetch("/api/auth/signout", {
        method: "POST",
      });

      // Navigate to landing page regardless of response
      // NextAuth will clear the session cookie
      window.location.href = "/";
    } catch (error) {
      console.error("Error signing out:", error);
      // Fallback: navigate anyway
      window.location.href = "/";
    }
  }

  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || user.email?.[0]?.toUpperCase() || "U";

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex items-center gap-4">
        {organizations.length > 0 && organization?.id && (
          <OrganizationSwitcher
            organizations={organizations}
            activeOrganizationId={organization.id}
          />
        )}
        <div className="text-sm">
          <p className="text-xs text-muted-foreground">
            {user.email || user.name || "Usuario"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Avatar>
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={handleSignOut}
        >
          Cerrar sesión
        </Button>
      </div>
    </header>
  );
}

