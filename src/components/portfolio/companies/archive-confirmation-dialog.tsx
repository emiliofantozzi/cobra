"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ArchiveConfirmationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyName: string;
  isArchived: boolean;
  onConfirm: () => void;
};

export function ArchiveConfirmationDialog({
  open,
  onOpenChange,
  companyName,
  isArchived,
  onConfirm,
}: ArchiveConfirmationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isArchived ? "Reactivar empresa" : "Archivar empresa"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isArchived ? (
              <>
                ¿Estás seguro de que quieres reactivar <strong>{companyName}</strong>?
                La empresa volverá a aparecer en tus listados y podrá recibir comunicaciones.
              </>
            ) : (
              <>
                ¿Estás seguro de que quieres archivar <strong>{companyName}</strong>?
                La empresa desaparecerá de tus listados por defecto, pero podrás reactivarla más tarde.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            {isArchived ? "Reactivar" : "Archivar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

