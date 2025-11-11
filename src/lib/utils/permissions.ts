import type { MembershipRole } from "@prisma/client";

export type Permission = 
  | "companies:read"
  | "companies:create"
  | "companies:update"
  | "companies:archive"
  | "companies:delete"
  | "companies:import"
  | "companies:export"
  | "contacts:read"
  | "contacts:create"
  | "contacts:update"
  | "contacts:delete"
  | "contacts:import"
  | "contacts:export"
  | "contacts:manage_optout"
  | "invoices:read"
  | "invoices:create"
  | "invoices:update"
  | "invoices:update_amount"
  | "invoices:update_status"
  | "invoices:update_dates"
  | "invoices:mark_paid"
  | "invoices:cancel"
  | "invoices:import"
  | "invoices:export";

const permissions: Record<Permission, MembershipRole[]> = {
  "companies:read": ["OWNER", "ADMIN", "MEMBER", "VIEWER"],
  "companies:create": ["OWNER", "ADMIN", "MEMBER"],
  "companies:update": ["OWNER", "ADMIN", "MEMBER"],
  "companies:archive": ["OWNER", "ADMIN", "MEMBER"],
  "companies:delete": ["OWNER"],
  "companies:import": ["OWNER", "ADMIN", "MEMBER"],
  "companies:export": ["OWNER", "ADMIN", "MEMBER", "VIEWER"],
  "contacts:read": ["OWNER", "ADMIN", "MEMBER", "VIEWER"],
  "contacts:create": ["OWNER", "ADMIN", "MEMBER"],
  "contacts:update": ["OWNER", "ADMIN", "MEMBER"],
  "contacts:delete": ["OWNER", "ADMIN", "MEMBER"],
  "contacts:import": ["OWNER", "ADMIN", "MEMBER"],
  "contacts:export": ["OWNER", "ADMIN", "MEMBER", "VIEWER"],
  "contacts:manage_optout": ["OWNER", "ADMIN", "MEMBER"],
  "invoices:read": ["OWNER", "ADMIN", "MEMBER", "VIEWER"],
  "invoices:create": ["OWNER", "ADMIN", "MEMBER"],
  "invoices:update": ["OWNER", "ADMIN", "MEMBER"],
  "invoices:update_amount": ["OWNER", "ADMIN"],
  "invoices:update_status": ["OWNER", "ADMIN", "MEMBER"],
  "invoices:update_dates": ["OWNER", "ADMIN", "MEMBER"],
  "invoices:mark_paid": ["OWNER", "ADMIN", "MEMBER"],
  "invoices:cancel": ["OWNER", "ADMIN"],
  "invoices:import": ["OWNER", "ADMIN", "MEMBER"],
  "invoices:export": ["OWNER", "ADMIN", "MEMBER", "VIEWER"],
};

export function hasPermission(role: MembershipRole | undefined, permission: Permission): boolean {
  if (!role) return false;
  return permissions[permission]?.includes(role) ?? false;
}

export function requirePermission(role: MembershipRole | undefined, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new Error(`No tienes permiso para realizar esta acción: ${permission}`);
  }
}

