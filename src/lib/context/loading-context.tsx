"use client";

import React, { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from "react";

interface LoadingContextValue {
  isLoading: boolean;
  loadingMessage?: string;
  startLoading: (message?: string) => void;
  stopLoading: () => void;
  setLoading: (loading: boolean, message?: string) => void;
}

const LoadingContext = createContext<LoadingContextValue | undefined>(undefined);

interface LoadingProviderProps {
  children: ReactNode;
  delay?: number; // Delay en ms antes de mostrar loading (default: 200ms)
}

export function LoadingProvider({ children, delay = 200 }: LoadingProviderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string | undefined>();
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, []);

  const startLoading = useCallback(
    (message?: string) => {
      // Cancelar timeout anterior si existe
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }

      timeoutIdRef.current = setTimeout(() => {
        setIsLoading(true);
        setLoadingMessage(message);
      }, delay);
    },
    [delay]
  );

  const stopLoading = useCallback(() => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
    setIsLoading(false);
    setLoadingMessage(undefined);
  }, []);

  const setLoading = useCallback(
    (loading: boolean, message?: string) => {
      if (loading) {
        startLoading(message);
      } else {
        stopLoading();
      }
    },
    [startLoading, stopLoading]
  );

  return (
    <LoadingContext.Provider
      value={{
        isLoading,
        loadingMessage,
        startLoading,
        stopLoading,
        setLoading,
      }}
    >
      {children}
    </LoadingContext.Provider>
  );
}

/**
 * Hook para acceder al contexto de loading
 * 
 * @example
 * const { isLoading, startLoading, stopLoading } = useLoadingIndicator();
 * 
 * startLoading("Cargando datos...");
 * // ... operación async
 * stopLoading();
 */
export function useLoadingIndicator() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error("useLoadingIndicator must be used within a LoadingProvider");
  }
  return context;
}

