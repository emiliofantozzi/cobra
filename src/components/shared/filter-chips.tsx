"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type FilterChip = {
  id: string;
  label: string;
  count?: number;
  active?: boolean;
};

type FilterChipsProps = {
  chips: FilterChip[];
  onChipClick?: (chipId: string) => void;
  className?: string;
};

export function FilterChips({ chips, onChipClick, className }: FilterChipsProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {chips.map((chip) => (
        <Button
          key={chip.id}
          variant={chip.active ? "default" : "outline"}
          size="sm"
          onClick={() => onChipClick?.(chip.id)}
          className="gap-2"
        >
          {chip.label}
          {chip.count !== undefined && (
            <Badge variant="secondary" className="ml-1">
              {chip.count}
            </Badge>
          )}
        </Button>
      ))}
    </div>
  );
}

