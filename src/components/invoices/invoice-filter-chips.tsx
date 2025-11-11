"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter, useSearchParams } from "next/navigation";

type ChipCounts = {
  sin_fecha: number;
  con_fecha: number;
  vence_hoy: number;
  vencidas: number;
  con_promesa_hoy: number;
  promesa_incumplida: number;
  disputa: number;
  pagadas: number;
};

type InvoiceFilterChipsProps = {
  initialCounts: ChipCounts;
};

const chipConfig = [
  { key: "sin_fecha", label: "Sin fecha" },
  { key: "con_fecha", label: "Con fecha" },
  { key: "vence_hoy", label: "Vencen hoy" },
  { key: "vencidas", label: "Vencidas" },
  { key: "con_promesa_hoy", label: "Con promesa hoy" },
  { key: "promesa_incumplida", label: "Promesa incumplida" },
  { key: "disputa", label: "Disputa" },
  { key: "pagadas", label: "Pagadas" },
] as const;

export function InvoiceFilterChips({ initialCounts }: InvoiceFilterChipsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [counts, setCounts] = useState<ChipCounts>(initialCounts);
  const activeChip = searchParams.get("chip") || null;

  // Refresh counts periodically (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch("/api/portfolio/invoices/chips");
        if (response.ok) {
          const newCounts = await response.json();
          setCounts(newCounts);
        }
      } catch (error) {
        console.error("Error refreshing chip counts:", error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleChipClick = (chipKey: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (activeChip === chipKey) {
      params.delete("chip");
    } else {
      params.set("chip", chipKey);
    }
    router.push(`/portfolio/invoices?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chipConfig.map((chip) => {
        const count = counts[chip.key as keyof ChipCounts];
        const isActive = activeChip === chip.key;

        return (
          <Button
            key={chip.key}
            variant={isActive ? "default" : "outline"}
            size="sm"
            className="gap-2"
            onClick={() => handleChipClick(chip.key)}
          >
            {chip.label}
            <Badge variant="secondary" className="ml-1">
              {count}
            </Badge>
          </Button>
        );
      })}
    </div>
  );
}

