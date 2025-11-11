"use client";

import { RouteProgressBar } from "@/components/shared/route-progress-bar";
import { LoadingProvider } from "@/lib/context/loading-context";

interface AppLayoutClientProps {
  children: React.ReactNode;
}

export function AppLayoutClient({ children }: AppLayoutClientProps) {
  return (
    <LoadingProvider>
      <RouteProgressBar />
      {children}
    </LoadingProvider>
  );
}

