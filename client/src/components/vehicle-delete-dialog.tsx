import { Loader2, AlertTriangle, Truck } from "lucide-react";
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
import type { Vehicle } from "@shared/schema";

interface VehicleDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: Vehicle | null;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function VehicleDeleteDialog({
  open,
  onOpenChange,
  vehicle,
  onConfirm,
  isLoading,
}: VehicleDeleteDialogProps) {
  if (!vehicle) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Excluir Veículo
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Você tem certeza que deseja excluir este veículo? Esta ação não pode ser desfeita.
              </p>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
                <Truck className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">{vehicle.name}</p>
                  <p className="text-sm text-muted-foreground">{vehicle.licensePlate}</p>
                  {vehicle.model && (
                    <p className="text-sm text-muted-foreground">{vehicle.model}</p>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Todos os dados relacionados a este veículo (histórico, alertas, viagens) também serão removidos.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Excluir Veículo
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

