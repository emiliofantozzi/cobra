"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home,
  Building2,
  Users,
  FileText,
  Tags,
  Inbox,
  Bot,
  FileCode,
  BookOpen,
  Settings2,
  BarChart3,
  TrendingUp,
  Briefcase,
  UserCog,
  CreditCard,
  Database,
  Key,
  FileSearch,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useState } from "react";

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavItem[];
};

const navigation: NavItem[] = [
  { name: "Hoy", href: "/home", icon: Home },
  {
    name: "Cartera",
    href: "/portfolio",
    icon: Briefcase,
    children: [
      { name: "Empresas", href: "/portfolio/companies", icon: Building2 },
      { name: "Contactos", href: "/portfolio/contacts", icon: Users },
      { name: "Facturas", href: "/portfolio/invoices", icon: FileText },
      { name: "Segmentos", href: "/portfolio/segments", icon: Tags },
    ],
  },
  { name: "Seguimiento", href: "/followup", icon: Inbox },
  {
    name: "Agente",
    href: "/agent",
    icon: Bot,
    children: [
      { name: "Regla base", href: "/agent", icon: Settings2 },
      { name: "Plantillas", href: "/agent/templates", icon: FileCode },
      { name: "Playbooks", href: "/agent/playbooks", icon: BookOpen },
      { name: "Reglas", href: "/agent/rules", icon: Settings2 },
      { name: "Canales", href: "/agent/channels", icon: Bot },
    ],
  },
  {
    name: "Reportes",
    href: "/reports",
    icon: BarChart3,
    children: [
      { name: "Resumen", href: "/reports/summary", icon: BarChart3 },
      { name: "Efectividad", href: "/reports/effectiveness", icon: TrendingUp },
    ],
  },
  {
    name: "Configuración",
    href: "/settings",
    icon: Settings2,
    children: [
      { name: "Mi organización", href: "/settings/organization", icon: Building2 },
      { name: "Equipo", href: "/settings/team", icon: Users },
      { name: "Mi cuenta", href: "/settings/account", icon: UserCog },
      { name: "Billing", href: "/settings/billing", icon: CreditCard },
      { name: "Datos", href: "/settings/data", icon: Database },
      { name: "API Keys", href: "/settings/api-keys", icon: Key },
      { name: "Auditoría", href: "/settings/audit", icon: FileSearch },
    ],
  },
];

function NavItemComponent({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(() => {
    // Auto-open if current path matches any child
    if (item.children) {
      return item.children.some(
        (child) => pathname === child.href || pathname?.startsWith(`${child.href}/`)
      );
    }
    return false;
  });

  const isActive =
    pathname === item.href ||
    pathname?.startsWith(`${item.href}/`) ||
    (item.children &&
      item.children.some(
        (child) => pathname === child.href || pathname?.startsWith(`${child.href}/`)
      ));

  if (item.children) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger
          className={cn(
            "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            isActive
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
          )}
        >
          <div className="flex items-center gap-3">
            <item.icon className="h-5 w-5" />
            {item.name}
          </div>
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent className="ml-4 mt-1 space-y-1">
          {item.children.map((child) => {
            const childIsActive =
              pathname === child.href || pathname?.startsWith(`${child.href}/`);
            return (
              <Link
                key={child.name}
                href={child.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  childIsActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                )}
              >
                <child.icon className="h-4 w-4" />
                {child.name}
              </Link>
            );
          })}
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
      )}
    >
      <item.icon className="h-5 w-5" />
      {item.name}
    </Link>
  );
}

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-sidebar-border bg-sidebar">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center border-b border-sidebar-border px-4">
          <Link href="/home" className="flex items-center">
            <Image
              src="/brand/logo-texto.svg"
              alt="COBRA Logo"
              width={120}
              height={40}
              className="h-10 w-auto"
              style={{ backgroundColor: "transparent" }}
            />
          </Link>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navigation.map((item) => (
            <NavItemComponent key={item.name} item={item} />
          ))}
        </nav>
      </div>
    </aside>
  );
}

