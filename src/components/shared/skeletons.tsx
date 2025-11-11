"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/lib/utils/motion";

/**
 * TableSkeleton - Skeleton para filas de tabla
 * 
 * @example
 * <TableSkeleton rows={5} columns={4} />
 */
export function TableSkeleton({
  rows = 5,
  columns = 4,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className={cn("w-full", className)} aria-busy="true" aria-label="Cargando tabla">
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="flex gap-4"
            aria-hidden="true"
          >
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={colIndex}
                className={cn(
                  "h-10 flex-1",
                  colIndex === 0 && "w-32", // Primera columna más pequeña (ej: checkbox)
                  colIndex === columns - 1 && "w-24" // Última columna más pequeña (ej: acciones)
                )}
                style={{
                  animation: prefersReducedMotion ? "none" : undefined,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * CardSkeleton - Skeleton para tarjetas de métricas
 * 
 * @example
 * <CardSkeleton count={3} />
 */
export function CardSkeleton({
  count = 1,
  className,
}: {
  count?: number;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className={cn("grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6", className)}
      aria-busy="true"
      aria-label="Cargando tarjetas"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="rounded-lg border bg-card p-6"
          aria-hidden="true"
        >
          <div className="flex items-center justify-between mb-4">
            <Skeleton
              className="h-4 w-24"
              style={{
                animation: prefersReducedMotion ? "none" : undefined,
              }}
            />
            <Skeleton
              className="h-5 w-16"
              style={{
                animation: prefersReducedMotion ? "none" : undefined,
              }}
            />
          </div>
          <Skeleton
            className="h-8 w-32 mb-2"
            style={{
              animation: prefersReducedMotion ? "none" : undefined,
            }}
          />
          <Skeleton
            className="h-3 w-40"
            style={{
              animation: prefersReducedMotion ? "none" : undefined,
            }}
          />
        </div>
      ))}
    </div>
  );
}

/**
 * FormSkeleton - Skeleton para formularios
 * 
 * @example
 * <FormSkeleton fields={5} />
 */
export function FormSkeleton({
  fields = 5,
  className,
}: {
  fields?: number;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className={cn("space-y-6", className)}
      aria-busy="true"
      aria-label="Cargando formulario"
    >
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2" aria-hidden="true">
          <Skeleton
            className="h-4 w-24"
            style={{
              animation: prefersReducedMotion ? "none" : undefined,
            }}
          />
          <Skeleton
            className="h-10 w-full"
            style={{
              animation: prefersReducedMotion ? "none" : undefined,
            }}
          />
        </div>
      ))}
      <div className="flex justify-end gap-2 pt-4">
        <Skeleton
          className="h-10 w-24"
          style={{
            animation: prefersReducedMotion ? "none" : undefined,
          }}
        />
        <Skeleton
          className="h-10 w-24"
          style={{
            animation: prefersReducedMotion ? "none" : undefined,
          }}
        />
      </div>
    </div>
  );
}

/**
 * DrawerSkeleton - Skeleton para contenido de drawer/sheet
 * 
 * @example
 * <DrawerSkeleton />
 */
export function DrawerSkeleton({ className }: { className?: string }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className={cn("space-y-6 p-6", className)}
      aria-busy="true"
      aria-label="Cargando contenido"
    >
      {/* Header */}
      <div className="space-y-2" aria-hidden="true">
        <Skeleton
          className="h-6 w-48"
          style={{
            animation: prefersReducedMotion ? "none" : undefined,
          }}
        />
        <Skeleton
          className="h-4 w-64"
          style={{
            animation: prefersReducedMotion ? "none" : undefined,
          }}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b" aria-hidden="true">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton
            key={index}
            className="h-10 w-24"
            style={{
              animation: prefersReducedMotion ? "none" : undefined,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="space-y-4" aria-hidden="true">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton
              className="h-4 w-32"
              style={{
                animation: prefersReducedMotion ? "none" : undefined,
              }}
            />
            <Skeleton
              className="h-10 w-full"
              style={{
                animation: prefersReducedMotion ? "none" : undefined,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

