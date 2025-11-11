"use client";

import { useState, useCallback, useRef } from "react";
import * as Sentry from "@sentry/nextjs";

export interface UseAsyncActionOptions<T> {
  /**
   * Mensaje de éxito a mostrar (opcional)
   */
  successMessage?: string;
  /**
   * Mensaje de error personalizado (opcional)
   */
  errorMessage?: string;
  /**
   * Callback cuando la acción tiene éxito
   */
  onSuccess?: (result: T) => void | Promise<void>;
  /**
   * Callback cuando la acción falla
   */
  onError?: (error: Error) => void | Promise<void>;
  /**
   * Nombre de la acción para telemetría (ej: "ui.portfolio.invoices.created")
   */
  actionName?: string;
  /**
   * Contexto adicional para telemetría (organizationId, userId, etc.)
   */
  context?: Record<string, unknown>;
  /**
   * Timeout en ms (opcional, por defecto sin timeout)
   */
  timeout?: number;
}

export interface UseAsyncActionReturn<T> {
  /**
   * Ejecutar la acción async
   */
  execute: (...args: unknown[]) => Promise<T | undefined>;
  /**
   * Estado de carga
   */
  isLoading: boolean;
  /**
   * Error si ocurrió
   */
  error: Error | null;
  /**
   * Resetear el estado de error
   */
  reset: () => void;
}

/**
 * Hook para manejar acciones async con loading state, error handling y telemetría
 * 
 * @example
 * const { execute, isLoading, error } = useAsyncAction(
 *   async (invoiceId: string) => {
 *     const res = await fetch(`/api/invoices/${invoiceId}`, { method: "DELETE" });
 *     if (!res.ok) throw new Error("Failed to delete");
 *     return res.json();
 *   },
 *   {
 *     actionName: "ui.portfolio.invoices.deleted",
 *     successMessage: "Factura eliminada",
 *     onSuccess: () => router.refresh(),
 *   }
 * );
 * 
 * <Button onClick={() => execute(invoiceId)} loading={isLoading}>
 *   Eliminar
 * </Button>
 */
export function useAsyncAction<T = unknown>(
  asyncFn: (...args: unknown[]) => Promise<T>,
  options: UseAsyncActionOptions<T> = {}
): UseAsyncActionReturn<T> {
  const {
    successMessage,
    errorMessage,
    onSuccess,
    onError,
    actionName,
    context = {},
    timeout,
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isExecutingRef = useRef(false);

  const reset = useCallback(() => {
    setError(null);
  }, []);

  const execute = useCallback(
    async (...args: unknown[]): Promise<T | undefined> => {
      // Prevenir doble ejecución
      if (isExecutingRef.current) {
        return undefined;
      }

      // Cancelar operación anterior si existe
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setIsLoading(true);
      setError(null);
      isExecutingRef.current = true;

      const startTime = Date.now();
      let spanId: string | undefined;

      try {
        // Iniciar span de Sentry si hay actionName
        if (actionName) {
          spanId = Sentry.startSpan(
            {
              op: "ui.action",
              name: `${actionName}.start`,
            },
            () => {
              Sentry.setContext("action_context", {
                ...context,
                timestamp: new Date().toISOString(),
              });
              return "span";
            }
          ) as unknown as string;
        }

        // Configurar timeout si se especifica
        let timeoutId: NodeJS.Timeout | undefined;
        if (timeout) {
          timeoutId = setTimeout(() => {
            abortController.abort();
            throw new Error(`Action timed out after ${timeout}ms`);
          }, timeout);
        }

        // Ejecutar la función async
        const result = await asyncFn(...args);

        // Limpiar timeout
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        // Si fue abortado, no continuar
        if (abortController.signal.aborted) {
          return undefined;
        }

        const duration = Date.now() - startTime;

        // Registrar éxito en Sentry
        if (actionName) {
          Sentry.startSpan(
            {
              op: "ui.action",
              name: `${actionName}.end`,
            },
            () => {
              Sentry.setContext("action_result", {
                ...context,
                success: true,
                duration,
                timestamp: new Date().toISOString(),
              });
            }
          );
        }

        // Callback de éxito
        if (onSuccess) {
          await onSuccess(result);
        }

        // Mostrar mensaje de éxito si existe (usando toast o similar)
        if (successMessage) {
          // TODO: Integrar con sistema de toasts cuando esté disponible
          console.log(successMessage);
        }

        return result;
      } catch (err) {
        const duration = Date.now() - startTime;
        const error = err instanceof Error ? err : new Error(String(err));

        // No registrar errores de abort
        if (!abortController.signal.aborted) {
          // Registrar error en Sentry
          if (actionName) {
            Sentry.captureException(error, {
              tags: {
                action: actionName,
              },
              contexts: {
                action_context: {
                  ...context,
                  duration,
                  success: false,
                  timestamp: new Date().toISOString(),
                },
              },
            });
          }

          // Callback de error
          if (onError) {
            await onError(error);
          }

          setError(error);

          // Mostrar mensaje de error
          const message = errorMessage || error.message || "Ocurrió un error";
          // TODO: Integrar con sistema de toasts cuando esté disponible
          console.error(message);
        }

        return undefined;
      } finally {
        setIsLoading(false);
        isExecutingRef.current = false;
        abortControllerRef.current = null;
      }
    },
    [
      asyncFn,
      actionName,
      context,
      timeout,
      onSuccess,
      onError,
      successMessage,
      errorMessage,
    ]
  );

  return {
    execute,
    isLoading,
    error,
    reset,
  };
}

