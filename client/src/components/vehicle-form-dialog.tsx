import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Truck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Vehicle, InsertVehicle } from "@shared/schema";

// Schema de validação para o formulário
const vehicleFormSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  licensePlate: z.string().min(5, "Placa deve ter pelo menos 5 caracteres"),
  model: z.string().optional(),
  status: z.enum(["moving", "stopped", "idle", "offline"]),
  ignition: z.enum(["on", "off"]),
  currentSpeed: z.coerce.number().min(0, "Velocidade não pode ser negativa"),
  speedLimit: z.coerce.number().min(1, "Limite deve ser maior que 0"),
  heading: z.coerce.number().min(0).max(360),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  accuracy: z.coerce.number().min(0),
  batteryLevel: z.coerce.number().min(0).max(100).optional(),
});

type VehicleFormData = z.infer<typeof vehicleFormSchema>;

interface VehicleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle?: Vehicle;
  onSubmit: (data: InsertVehicle) => void;
  isLoading?: boolean;
}

export function VehicleFormDialog({
  open,
  onOpenChange,
  vehicle,
  onSubmit,
  isLoading,
}: VehicleFormDialogProps) {
  const isEditing = !!vehicle;

  const form = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: {
      name: "",
      licensePlate: "",
      model: "",
      status: "offline",
      ignition: "off",
      currentSpeed: 0,
      speedLimit: 80,
      heading: 0,
      latitude: -23.5505,
      longitude: -46.6333,
      accuracy: 5,
      batteryLevel: 100,
    },
  });

  // Atualiza o formulário quando o veículo muda
  useEffect(() => {
    if (vehicle) {
      form.reset({
        name: vehicle.name,
        licensePlate: vehicle.licensePlate,
        model: vehicle.model || "",
        status: vehicle.status,
        ignition: vehicle.ignition,
        currentSpeed: vehicle.currentSpeed,
        speedLimit: vehicle.speedLimit,
        heading: vehicle.heading,
        latitude: vehicle.latitude,
        longitude: vehicle.longitude,
        accuracy: vehicle.accuracy,
        batteryLevel: vehicle.batteryLevel,
      });
    } else {
      form.reset({
        name: "",
        licensePlate: "",
        model: "",
        status: "offline",
        ignition: "off",
        currentSpeed: 0,
        speedLimit: 80,
        heading: 0,
        latitude: -23.5505,
        longitude: -46.6333,
        accuracy: 5,
        batteryLevel: 100,
      });
    }
  }, [vehicle, form]);

  const handleSubmit = (data: VehicleFormData) => {
    const submitData: InsertVehicle = {
      ...data,
      lastUpdate: new Date().toISOString(),
    };
    onSubmit(submitData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            {isEditing ? "Editar Veículo" : "Novo Veículo"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize as informações do veículo abaixo."
              : "Preencha as informações para cadastrar um novo veículo."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Caminhão 01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="licensePlate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Placa *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: ABC-1234" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Modelo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Mercedes Actros" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="moving">Em Movimento</SelectItem>
                        <SelectItem value="stopped">Parado</SelectItem>
                        <SelectItem value="idle">Ocioso</SelectItem>
                        <SelectItem value="offline">Offline</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ignition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ignição</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="on">Ligada</SelectItem>
                        <SelectItem value="off">Desligada</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="speedLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Limite de Velocidade (km/h)</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currentSpeed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Velocidade Atual (km/h)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitude</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.0001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="longitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitude</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.0001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="heading"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Direção (°)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} max={360} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accuracy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precisão (m)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="batteryLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bateria (%)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} max={100} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Salvar Alterações" : "Cadastrar Veículo"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

