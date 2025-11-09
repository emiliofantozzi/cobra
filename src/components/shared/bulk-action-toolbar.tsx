"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

type BulkActionToolbarProps = {
  selectedCount: number;
  onClearSelection?: () => void;
  actions?: React.ReactNode;
  className?: string;
};

export function BulkActionToolbar({
  selectedCount,
  onClearSelection,
  actions,
  className,
}: BulkActionToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-lg border bg-muted/50 p-2",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {selectedCount} elemento{selectedCount !== 1 ? "s" : ""} seleccionado
          {selectedCount !== 1 ? "s" : ""}
        </span>
        {onClearSelection && (
          <Button variant="ghost" size="sm" onClick={onClearSelection}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

