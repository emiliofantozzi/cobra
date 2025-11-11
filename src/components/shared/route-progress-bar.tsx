"use client";

import { AppProgressBar } from "next-nprogress-bar";
import { useReducedMotion } from "@/lib/utils/motion";

/**
 * RouteProgressBar - Barra de progreso superior para navegación entre páginas
 * 
 * Muestra una barra de progreso en la parte superior cuando la navegación
 * tarda más de 200ms, evitando flicker en transiciones rápidas.
 * 
 * Respeta prefers-reduced-motion para accesibilidad.
 */
export function RouteProgressBar() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <AppProgressBar
      height="3px"
      color="hsl(var(--primary))"
      options={{ 
        showSpinner: false,
        easing: prefersReducedMotion ? "linear" : "ease",
        speed: prefersReducedMotion ? 0 : 500,
        minimum: 0.08,
        trickleSpeed: 200,
      }}
      delay={200}
    />
  );
}

