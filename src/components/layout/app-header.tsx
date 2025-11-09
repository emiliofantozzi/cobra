"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { OrganizationSwitcher } from "@/components/layout/organization-switcher";
import { Search, Plus, Bell, FileText, Building2, Users } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  async function handleSignOut() {
    try {
      const response = await fetch("/api/auth/signout", {
        method: "POST",
      });
      window.location.href = "/";
    } catch (error) {
      console.error("Error signing out:", error);
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
      <div className="flex flex-1 items-center gap-4">
        {organizations.length > 0 && organization?.id && (
          <OrganizationSwitcher
            organizations={organizations}
            activeOrganizationId={organization.id}
          />
        )}
        {/* Global Search */}
        <button
          onClick={() => setSearchOpen(true)}
          className={cn(
            "flex h-9 w-full max-w-sm items-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground transition-colors",
            "hover:bg-accent hover:text-accent-foreground",
          )}
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Buscar...</span>
          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      </div>
      <div className="flex items-center gap-2">
        {/* Crear Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="default" size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Crear
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={() => router.push("/portfolio/invoices/new")}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Factura
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push("/portfolio/companies/new")}
              className="gap-2"
            >
              <Building2 className="h-4 w-4" />
              Empresa
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push("/portfolio/contacts/new")}
              className="gap-2"
            >
              <Users className="h-4 w-4" />
              Contacto
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => router.push("/portfolio/segments/new")}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Segmento
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary"></span>
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-ring">
              <Avatar>
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user.name || "Usuario"}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/settings/account")}>
              Mi cuenta
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings/organization")}>
              Configuración
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

