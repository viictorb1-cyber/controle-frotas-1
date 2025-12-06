import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn(
    'Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY não configuradas. ' +
    'Usando armazenamento em memória.'
  );
}

// Cliente do servidor usa a service_role key para bypass de RLS quando necessário
export const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

// Cliente para operações que respeitam RLS (usando a anon key)
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export const supabaseClient = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isSupabaseConfigured = (): boolean => {
  return supabase !== null;
};

// Tipos para as tabelas do Supabase
export interface Database {
  public: {
    Tables: {
      vehicles: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          license_plate: string;
          model: string | null;
          status: 'moving' | 'stopped' | 'idle' | 'offline';
          ignition: 'on' | 'off';
          current_speed: number;
          speed_limit: number;
          heading: number;
          latitude: number;
          longitude: number;
          accuracy: number;
          last_update: string;
          battery_level: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['vehicles']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['vehicles']['Insert']>;
      };
      geofences: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          type: 'circle' | 'polygon';
          active: boolean;
          center: { latitude: number; longitude: number } | null;
          radius: number | null;
          points: { latitude: number; longitude: number }[] | null;
          rules: Array<{
            type: 'entry' | 'exit' | 'dwell' | 'time_violation';
            enabled: boolean;
            dwellTimeMinutes?: number;
            startTime?: string;
            endTime?: string;
            toleranceSeconds?: number;
          }>;
          vehicle_ids: string[];
          last_triggered: string | null;
          color: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['geofences']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['geofences']['Insert']>;
      };
      alerts: {
        Row: {
          id: string;
          user_id: string;
          type: 'speed' | 'geofence_entry' | 'geofence_exit' | 'geofence_dwell' | 'system';
          priority: 'critical' | 'warning' | 'info';
          vehicle_id: string;
          vehicle_name: string;
          message: string;
          timestamp: string;
          read: boolean;
          latitude: number | null;
          longitude: number | null;
          speed: number | null;
          speed_limit: number | null;
          geofence_name: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['alerts']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['alerts']['Insert']>;
      };
      trips: {
        Row: {
          id: string;
          user_id: string;
          vehicle_id: string;
          start_time: string;
          end_time: string;
          total_distance: number;
          travel_time: number;
          stopped_time: number;
          average_speed: number;
          max_speed: number;
          stops_count: number;
          points: Array<{
            latitude: number;
            longitude: number;
            speed: number;
            heading: number;
            timestamp: string;
            accuracy?: number;
          }>;
          events: Array<{
            id: string;
            type: string;
            latitude: number;
            longitude: number;
            timestamp: string;
            duration?: number;
            speed?: number;
            speedLimit?: number;
            geofenceName?: string;
            address?: string;
          }>;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['trips']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['trips']['Insert']>;
      };
      speed_violations: {
        Row: {
          id: string;
          user_id: string;
          vehicle_id: string;
          vehicle_name: string;
          speed: number;
          speed_limit: number;
          excess_speed: number;
          timestamp: string;
          latitude: number;
          longitude: number;
          duration: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['speed_violations']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['speed_violations']['Insert']>;
      };
    };
  };
}

