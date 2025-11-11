"use client";

import { Loader2 } from "lucide-react";
import { useReducedMotion } from "@/lib/utils/motion";

type LoadingStateProps = {
  message?: string;
  className?: string;
};

export function LoadingState({
  message = "Cargando...",
  className,
}: LoadingStateProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className={`flex flex-col items-center justify-center py-12 gap-3 ${className || ""}`}
      aria-busy="true"
      aria-live="polite"
      role="status"
    >
      <Loader2
        className={`h-6 w-6 animate-spin text-muted-foreground ${
          prefersReducedMotion ? "animate-none" : ""
        }`}
        aria-hidden="true"
      />
      <p className="text-sm text-muted-foreground">{message}</p>
      <span className="sr-only">{message}</span>
    </div>
  );
}

