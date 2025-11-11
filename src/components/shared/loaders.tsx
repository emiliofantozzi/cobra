"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/lib/utils/motion";

/**
 * SectionLoader - Spinner centrado con mensaje para secciones completas
 * 
 * @example
 * <SectionLoader message="Cargando facturas..." />
 */
export function SectionLoader({
  message = "Cargando...",
  className,
}: {
  message?: string;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 gap-3",
        className
      )}
      aria-busy="true"
      aria-live="polite"
      role="status"
    >
      <Loader2
        className={cn(
          "h-6 w-6 animate-spin text-muted-foreground",
          prefersReducedMotion && "animate-none"
        )}
        aria-hidden="true"
      />
      <p className="text-sm text-muted-foreground">{message}</p>
      <span className="sr-only">{message}</span>
    </div>
  );
}

/**
 * InlineLoader - Mini spinner para acciones inline sin bloquear toda la UI
 * 
 * @example
 * <InlineLoader message="Guardando..." />
 */
export function InlineLoader({
  message,
  size = "sm",
  className,
}: {
  message?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  return (
    <span
      className={cn("inline-flex items-center gap-2", className)}
      aria-busy="true"
      aria-live="polite"
      role="status"
    >
      <Loader2
        className={cn(
          sizeClasses[size],
          "animate-spin text-muted-foreground",
          prefersReducedMotion && "animate-none"
        )}
        aria-hidden="true"
      />
      {message && (
        <>
          <span className="text-sm text-muted-foreground">{message}</span>
          <span className="sr-only">{message}</span>
        </>
      )}
    </span>
  );
}

