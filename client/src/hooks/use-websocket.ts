import { useEffect, useRef, useCallback, useState } from "react";
import { queryClient } from "@/lib/queryClient";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Vehicle } from "@shared/schema";
import type { RealtimeChannel } from "@supabase/supabase-js";

type WebSocketMessage = {
  type: "vehicles";
  data: Vehicle[];
};

function isValidVehicleMessage(msg: unknown): msg is WebSocketMessage {
  if (!msg || typeof msg !== "object") return false;
  const obj = msg as Record<string, unknown>;
  return obj.type === "vehicles" && Array.isArray(obj.data);
}

// Mapeia dados do Supabase para o formato Vehicle
function mapVehicleFromSupabase(row: any): Vehicle {
  return {
    id: row.id,
    name: row.name,
    licensePlate: row.license_plate,
    model: row.model || undefined,
    status: row.status,
    ignition: row.ignition,
    currentSpeed: row.current_speed,
    speedLimit: row.speed_limit,
    heading: row.heading,
    latitude: row.latitude,
    longitude: row.longitude,
    accuracy: row.accuracy,
    lastUpdate: row.last_update,
    batteryLevel: row.battery_level || undefined,
  };
}

// Hook para Supabase Realtime
function useSupabaseRealtime() {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(() => {
    if (!supabase || channelRef.current) return;

    try {
      // Canal para escutar mudanças na tabela vehicles
      const channel = supabase
        .channel('vehicles-changes')
        .on(
          'postgres_changes',
          {
            event: '*', // INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'vehicles',
          },
          async (payload) => {
            console.log('Realtime vehicle change:', payload.eventType);
            
            // Quando houver mudança, atualiza o cache local
            const currentVehicles = queryClient.getQueryData<Vehicle[]>(['/api/vehicles']) || [];
            
            if (payload.eventType === 'INSERT' && payload.new) {
              const newVehicle = mapVehicleFromSupabase(payload.new);
              queryClient.setQueryData(['/api/vehicles'], [...currentVehicles, newVehicle]);
            } 
            else if (payload.eventType === 'UPDATE' && payload.new) {
              const updatedVehicle = mapVehicleFromSupabase(payload.new);
              const updatedList = currentVehicles.map(v => 
                v.id === updatedVehicle.id ? updatedVehicle : v
              );
              queryClient.setQueryData(['/api/vehicles'], updatedList);
            } 
            else if (payload.eventType === 'DELETE' && payload.old) {
              const deletedId = payload.old.id;
              const filteredList = currentVehicles.filter(v => v.id !== deletedId);
              queryClient.setQueryData(['/api/vehicles'], filteredList);
            }
          }
        )
        .subscribe((status) => {
          console.log('Supabase Realtime status:', status);
          setIsConnected(status === 'SUBSCRIBED');
        });

      channelRef.current = channel;
    } catch (error) {
      console.error('Failed to connect to Supabase Realtime:', error);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (channelRef.current) {
      supabase?.removeChannel(channelRef.current);
      channelRef.current = null;
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { isConnected, channelRef };
}

// Hook para WebSocket tradicional (fallback)
function useTraditionalWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const wsUrl = window.location.origin
        .replace(/^http:/, "ws:")
        .replace(/^https:/, "wss:") + "/ws";
      
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("WebSocket connected to", wsUrl);
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const message: unknown = JSON.parse(event.data);
          
          if (isValidVehicleMessage(message)) {
            queryClient.setQueryData(["/api/vehicles"], message.data);
          }
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected, reconnecting in 3s...");
        setIsConnected(false);
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        ws.close();
      };

      wsRef.current = ws;
    } catch (error) {
      console.error("Failed to create WebSocket:", error);
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return { wsRef, isConnected };
}

// Hook principal que escolhe entre Supabase Realtime ou WebSocket tradicional
export function useVehicleWebSocket() {
  const useSupabase = isSupabaseConfigured();
  
  // Usa Supabase Realtime se configurado
  const supabaseRealtime = useSupabaseRealtime();
  const traditionalWs = useTraditionalWebSocket();
  
  // Retorna o ref apropriado (mantém compatibilidade com código existente)
  if (useSupabase) {
    return {
      isConnected: supabaseRealtime.isConnected,
      connectionType: 'supabase' as const,
    };
  }
  
  return {
    wsRef: traditionalWs.wsRef,
    isConnected: traditionalWs.isConnected,
    connectionType: 'websocket' as const,
  };
}

// Hook adicional para escutar alertas em tempo real
export function useAlertsRealtime() {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel('alerts-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alerts',
        },
        (payload) => {
          console.log('New alert received:', payload.new);
          // Invalida o cache de alertas para recarregar
          queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  return channelRef;
}

// Hook para escutar geofences em tempo real
export function useGeofencesRealtime() {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel('geofences-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'geofences',
        },
        () => {
          // Invalida o cache de geofences para recarregar
          queryClient.invalidateQueries({ queryKey: ['/api/geofences'] });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  return channelRef;
}
