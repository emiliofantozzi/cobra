"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  status: string;
  variant?: "default" | "secondary" | "destructive" | "outline";
  className?: string;
};

const statusVariantMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  // Invoice statuses
  DRAFT: "outline",
  PENDING: "secondary",
  PARTIALLY_PAID: "default",
  PAID: "default",
  OVERDUE: "destructive",
  CANCELLED: "outline",
  // Collection statuses
  ACTIVE: "default",
  PAUSED: "secondary",
  CLOSED: "outline",
  // Custom statuses
  "Sin fecha": "secondary",
  "Vencida": "destructive",
  "Promesa hoy": "default",
  "Con fecha": "default",
};

export function StatusBadge({ status, variant, className }: StatusBadgeProps) {
  const badgeVariant = variant || statusVariantMap[status] || "outline";

  return (
    <Badge variant={badgeVariant} className={cn(className)}>
      {status}
    </Badge>
  );
}

