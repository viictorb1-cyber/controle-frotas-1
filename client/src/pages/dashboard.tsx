import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { VehicleList } from "@/components/vehicle-list";
import { VehicleDetailPanel } from "@/components/vehicle-detail-panel";
import { FleetMap } from "@/components/fleet-map";
import { VehicleFormDialog } from "@/components/vehicle-form-dialog";
import { VehicleDeleteDialog } from "@/components/vehicle-delete-dialog";
import { useVehicleWebSocket } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Vehicle, Alert, Geofence, InsertVehicle } from "@shared/schema";

export default function Dashboard() {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | undefined>();
  const [followVehicle, setFollowVehicle] = useState<Vehicle | undefined>();
  const [recentTrail, setRecentTrail] = useState<{ latitude: number; longitude: number }[]>([]);
  
  // Estados dos dialogs
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [vehicleToEdit, setVehicleToEdit] = useState<Vehicle | undefined>();
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  useVehicleWebSocket();

  const { data: vehicles = [], isLoading: isLoadingVehicles } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const { data: alerts = [] } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
    refetchInterval: 10000,
  });

  const { data: geofences = [] } = useQuery<Geofence[]>({
    queryKey: ["/api/geofences"],
  });

  // Mutation para criar veículo
  const createVehicleMutation = useMutation({
    mutationFn: async (data: InsertVehicle) => {
      const response = await apiRequest("POST", "/api/vehicles", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      setIsFormDialogOpen(false);
      toast({
        title: "Veículo cadastrado",
        description: "O veículo foi cadastrado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao cadastrar",
        description: error.message || "Não foi possível cadastrar o veículo.",
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar veículo
  const updateVehicleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertVehicle> }) => {
      const response = await apiRequest("PATCH", `/api/vehicles/${id}`, data);
      return response.json();
    },
    onSuccess: (updatedVehicle) => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      setIsFormDialogOpen(false);
      setVehicleToEdit(undefined);
      
      // Atualiza o veículo selecionado se for o mesmo
      if (selectedVehicle?.id === updatedVehicle.id) {
        setSelectedVehicle(updatedVehicle);
      }
      
      toast({
        title: "Veículo atualizado",
        description: "As alterações foram salvas com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message || "Não foi possível atualizar o veículo.",
        variant: "destructive",
      });
    },
  });

  // Mutation para deletar veículo
  const deleteVehicleMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/vehicles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      setIsDeleteDialogOpen(false);
      
      // Fecha o painel de detalhes se o veículo deletado estava selecionado
      if (selectedVehicle?.id === vehicleToDelete?.id) {
        setSelectedVehicle(undefined);
        setFollowVehicle(undefined);
        setRecentTrail([]);
      }
      
      setVehicleToDelete(null);
      
      toast({
        title: "Veículo excluído",
        description: "O veículo foi removido com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir",
        description: error.message || "Não foi possível excluir o veículo.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (selectedVehicle && vehicles.length > 0) {
      const updatedVehicle = vehicles.find(v => v.id === selectedVehicle.id);
      if (updatedVehicle) {
        setSelectedVehicle(updatedVehicle);
        
        setRecentTrail(prev => {
          const newTrail = [...prev, { latitude: updatedVehicle.latitude, longitude: updatedVehicle.longitude }];
          return newTrail.slice(-20);
        });

        if (followVehicle?.id === selectedVehicle.id) {
          setFollowVehicle(updatedVehicle);
        }
      }
    }
  }, [vehicles, selectedVehicle?.id, followVehicle?.id]);

  const handleSelectVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setFollowVehicle(undefined);
    setRecentTrail([{ latitude: vehicle.latitude, longitude: vehicle.longitude }]);
  };

  const handleCloseDetail = () => {
    setSelectedVehicle(undefined);
    setFollowVehicle(undefined);
    setRecentTrail([]);
  };

  const handleFollowVehicle = () => {
    if (followVehicle?.id === selectedVehicle?.id) {
      setFollowVehicle(undefined);
    } else {
      setFollowVehicle(selectedVehicle);
    }
  };

  // Handlers para CRUD
  const handleAddVehicle = () => {
    setVehicleToEdit(undefined);
    setIsFormDialogOpen(true);
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setVehicleToEdit(vehicle);
    setIsFormDialogOpen(true);
  };

  const handleDeleteVehicle = (vehicle: Vehicle) => {
    setVehicleToDelete(vehicle);
    setIsDeleteDialogOpen(true);
  };

  const handleFormSubmit = (data: InsertVehicle) => {
    if (vehicleToEdit) {
      updateVehicleMutation.mutate({ id: vehicleToEdit.id, data });
    } else {
      createVehicleMutation.mutate(data);
    }
  };

  const handleConfirmDelete = () => {
    if (vehicleToDelete) {
      deleteVehicleMutation.mutate(vehicleToDelete.id);
    }
  };

  return (
    <div className="flex h-full" data-testid="dashboard-page">
      <div className="w-80 flex-shrink-0 border-r border-sidebar-border bg-sidebar">
        <VehicleList
          vehicles={vehicles}
          selectedVehicleId={selectedVehicle?.id}
          onSelectVehicle={handleSelectVehicle}
          onAddVehicle={handleAddVehicle}
          isLoading={isLoadingVehicles}
        />
      </div>
      
      <div className="flex-1 relative">
        <FleetMap
          vehicles={vehicles}
          geofences={geofences}
          selectedVehicle={selectedVehicle}
          followVehicle={followVehicle}
          recentTrail={recentTrail}
          onSelectVehicle={handleSelectVehicle}
        />
      </div>
      
      {selectedVehicle && (
        <div className="w-[360px] flex-shrink-0 border-l border-sidebar-border">
          <VehicleDetailPanel
            vehicle={selectedVehicle}
            alerts={alerts}
            onClose={handleCloseDetail}
            onFollowVehicle={handleFollowVehicle}
            isFollowing={followVehicle?.id === selectedVehicle.id}
            onEditVehicle={handleEditVehicle}
            onDeleteVehicle={handleDeleteVehicle}
          />
        </div>
      )}

      {/* Dialog de criar/editar veículo */}
      <VehicleFormDialog
        open={isFormDialogOpen}
        onOpenChange={setIsFormDialogOpen}
        vehicle={vehicleToEdit}
        onSubmit={handleFormSubmit}
        isLoading={createVehicleMutation.isPending || updateVehicleMutation.isPending}
      />

      {/* Dialog de confirmação de exclusão */}
      <VehicleDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        vehicle={vehicleToDelete}
        onConfirm={handleConfirmDelete}
        isLoading={deleteVehicleMutation.isPending}
      />
    </div>
  );
}
