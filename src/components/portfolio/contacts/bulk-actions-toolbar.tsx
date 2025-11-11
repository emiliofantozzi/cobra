"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { X } from "lucide-react";

type BulkActionsToolbarProps = {
  selectedCount: number;
  onCancel: () => void;
  onBulkOptOut: (channel: "email" | "whatsapp", optedOut: boolean) => void;
};

export function BulkActionsToolbar({
  selectedCount,
  onCancel,
  onBulkOptOut,
}: BulkActionsToolbarProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          {selectedCount} contacto{selectedCount > 1 ? "s" : ""} seleccionado{selectedCount > 1 ? "s" : ""}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Cambiar opt-out
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onBulkOptOut("email", true)}>
              Activar opt-out Email
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onBulkOptOut("email", false)}>
              Desactivar opt-out Email
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onBulkOptOut("whatsapp", true)}>
              Activar opt-out WhatsApp
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onBulkOptOut("whatsapp", false)}>
              Desactivar opt-out WhatsApp
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" size="sm" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
      </div>
    </div>
  );
}

