import { supabase, isSupabaseConfigured } from './lib/supabase';
import type { 
  Vehicle, InsertVehicle,
  Geofence, InsertGeofence,
  Alert, InsertAlert,
  Trip, SpeedViolation, VehicleStats
} from '@shared/schema';
import type { IStorage } from './storage';

// Mapeia Vehicle do banco para o tipo da aplicação
function mapVehicleFromDb(row: any): Vehicle {
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

// Mapeia Vehicle da aplicação para o banco
function mapVehicleToDb(vehicle: InsertVehicle & { id?: string }): any {
  return {
    ...(vehicle.id && { id: vehicle.id }),
    name: vehicle.name,
    license_plate: vehicle.licensePlate,
    model: vehicle.model || null,
    status: vehicle.status,
    ignition: vehicle.ignition,
    current_speed: vehicle.currentSpeed,
    speed_limit: vehicle.speedLimit,
    heading: vehicle.heading,
    latitude: vehicle.latitude,
    longitude: vehicle.longitude,
    accuracy: vehicle.accuracy,
    last_update: vehicle.lastUpdate,
    battery_level: vehicle.batteryLevel || null,
  };
}

// Mapeia Geofence do banco para o tipo da aplicação
function mapGeofenceFromDb(row: any): Geofence {
  return {
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    type: row.type,
    active: row.active,
    center: row.center || undefined,
    radius: row.radius || undefined,
    points: row.points || undefined,
    rules: row.rules || [],
    vehicleIds: row.vehicle_ids || [],
    lastTriggered: row.last_triggered || undefined,
    color: row.color || undefined,
  };
}

// Mapeia Geofence da aplicação para o banco
function mapGeofenceToDb(geofence: InsertGeofence & { id?: string }): any {
  return {
    ...(geofence.id && { id: geofence.id }),
    name: geofence.name,
    description: geofence.description || null,
    type: geofence.type,
    active: geofence.active,
    center: geofence.center || null,
    radius: geofence.radius || null,
    points: geofence.points || null,
    rules: geofence.rules,
    vehicle_ids: geofence.vehicleIds,
    last_triggered: geofence.lastTriggered || null,
    color: geofence.color || null,
  };
}

// Mapeia Alert do banco para o tipo da aplicação
function mapAlertFromDb(row: any): Alert {
  return {
    id: row.id,
    type: row.type,
    priority: row.priority,
    vehicleId: row.vehicle_id,
    vehicleName: row.vehicle_name,
    message: row.message,
    timestamp: row.timestamp,
    read: row.read,
    latitude: row.latitude || undefined,
    longitude: row.longitude || undefined,
    speed: row.speed || undefined,
    speedLimit: row.speed_limit || undefined,
    geofenceName: row.geofence_name || undefined,
  };
}

// Mapeia Alert da aplicação para o banco
function mapAlertToDb(alert: InsertAlert & { id?: string }): any {
  return {
    ...(alert.id && { id: alert.id }),
    type: alert.type,
    priority: alert.priority,
    vehicle_id: alert.vehicleId,
    vehicle_name: alert.vehicleName,
    message: alert.message,
    timestamp: alert.timestamp,
    read: alert.read,
    latitude: alert.latitude || null,
    longitude: alert.longitude || null,
    speed: alert.speed || null,
    speed_limit: alert.speedLimit || null,
    geofence_name: alert.geofenceName || null,
  };
}

// Mapeia Trip do banco para o tipo da aplicação
function mapTripFromDb(row: any): Trip {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    startTime: row.start_time,
    endTime: row.end_time,
    totalDistance: row.total_distance,
    travelTime: row.travel_time,
    stoppedTime: row.stopped_time,
    averageSpeed: row.average_speed,
    maxSpeed: row.max_speed,
    stopsCount: row.stops_count,
    points: row.points || [],
    events: row.events || [],
  };
}

// Mapeia SpeedViolation do banco para o tipo da aplicação
function mapSpeedViolationFromDb(row: any): SpeedViolation {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    vehicleName: row.vehicle_name,
    speed: row.speed,
    speedLimit: row.speed_limit,
    excessSpeed: row.excess_speed,
    timestamp: row.timestamp,
    latitude: row.latitude,
    longitude: row.longitude,
    duration: row.duration,
  };
}

export class SupabaseStorage implements IStorage {
  constructor() {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase não está configurado. Verifique as variáveis de ambiente.');
    }
  }

  // ==================== VEHICLES ====================

  async getVehicles(): Promise<Vehicle[]> {
    const { data, error } = await supabase!
      .from('vehicles')
      .select('*')
      .order('name');

    if (error) {
      console.error('Erro ao buscar veículos:', error);
      throw error;
    }

    return (data || []).map(mapVehicleFromDb);
  }

  async getVehicle(id: string): Promise<Vehicle | undefined> {
    const { data, error } = await supabase!
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return undefined;
      console.error('Erro ao buscar veículo:', error);
      throw error;
    }

    return data ? mapVehicleFromDb(data) : undefined;
  }

  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    const { data, error } = await supabase!
      .from('vehicles')
      .insert(mapVehicleToDb(vehicle))
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar veículo:', error);
      throw error;
    }

    return mapVehicleFromDb(data);
  }

  async updateVehicle(id: string, updates: Partial<Vehicle>): Promise<Vehicle | undefined> {
    const dbUpdates: Record<string, any> = {};
    
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.licensePlate !== undefined) dbUpdates.license_plate = updates.licensePlate;
    if (updates.model !== undefined) dbUpdates.model = updates.model;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.ignition !== undefined) dbUpdates.ignition = updates.ignition;
    if (updates.currentSpeed !== undefined) dbUpdates.current_speed = updates.currentSpeed;
    if (updates.speedLimit !== undefined) dbUpdates.speed_limit = updates.speedLimit;
    if (updates.heading !== undefined) dbUpdates.heading = updates.heading;
    if (updates.latitude !== undefined) dbUpdates.latitude = updates.latitude;
    if (updates.longitude !== undefined) dbUpdates.longitude = updates.longitude;
    if (updates.accuracy !== undefined) dbUpdates.accuracy = updates.accuracy;
    if (updates.lastUpdate !== undefined) dbUpdates.last_update = updates.lastUpdate;
    if (updates.batteryLevel !== undefined) dbUpdates.battery_level = updates.batteryLevel;
    
    dbUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase!
      .from('vehicles')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return undefined;
      console.error('Erro ao atualizar veículo:', error);
      throw error;
    }

    return data ? mapVehicleFromDb(data) : undefined;
  }

  async deleteVehicle(id: string): Promise<boolean> {
    // Primeiro verifica se o veículo existe
    const { data: existing } = await supabase!
      .from('vehicles')
      .select('id')
      .eq('id', id)
      .single();

    if (!existing) {
      return false;
    }

    const { error } = await supabase!
      .from('vehicles')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar veículo:', error);
      throw error;
    }

    return true;
  }

  // ==================== GEOFENCES ====================

  async getGeofences(): Promise<Geofence[]> {
    const { data, error } = await supabase!
      .from('geofences')
      .select('*')
      .order('name');

    if (error) {
      console.error('Erro ao buscar geofences:', error);
      throw error;
    }

    return (data || []).map(mapGeofenceFromDb);
  }

  async getGeofence(id: string): Promise<Geofence | undefined> {
    const { data, error } = await supabase!
      .from('geofences')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return undefined;
      console.error('Erro ao buscar geofence:', error);
      throw error;
    }

    return data ? mapGeofenceFromDb(data) : undefined;
  }

  async createGeofence(geofence: InsertGeofence): Promise<Geofence> {
    const { data, error } = await supabase!
      .from('geofences')
      .insert(mapGeofenceToDb(geofence))
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar geofence:', error);
      throw error;
    }

    return mapGeofenceFromDb(data);
  }

  async updateGeofence(id: string, updates: Partial<Geofence>): Promise<Geofence | undefined> {
    const dbUpdates: Record<string, any> = {};
    
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.active !== undefined) dbUpdates.active = updates.active;
    if (updates.center !== undefined) dbUpdates.center = updates.center;
    if (updates.radius !== undefined) dbUpdates.radius = updates.radius;
    if (updates.points !== undefined) dbUpdates.points = updates.points;
    if (updates.rules !== undefined) dbUpdates.rules = updates.rules;
    if (updates.vehicleIds !== undefined) dbUpdates.vehicle_ids = updates.vehicleIds;
    if (updates.lastTriggered !== undefined) dbUpdates.last_triggered = updates.lastTriggered;
    if (updates.color !== undefined) dbUpdates.color = updates.color;
    
    dbUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase!
      .from('geofences')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return undefined;
      console.error('Erro ao atualizar geofence:', error);
      throw error;
    }

    return data ? mapGeofenceFromDb(data) : undefined;
  }

  async deleteGeofence(id: string): Promise<boolean> {
    // Primeiro verifica se o geofence existe
    const { data: existing } = await supabase!
      .from('geofences')
      .select('id')
      .eq('id', id)
      .single();

    if (!existing) {
      return false;
    }

    const { error } = await supabase!
      .from('geofences')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar geofence:', error);
      throw error;
    }

    return true;
  }

  // ==================== ALERTS ====================

  async getAlerts(): Promise<Alert[]> {
    const { data, error } = await supabase!
      .from('alerts')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Erro ao buscar alertas:', error);
      throw error;
    }

    return (data || []).map(mapAlertFromDb);
  }

  async getAlert(id: string): Promise<Alert | undefined> {
    const { data, error } = await supabase!
      .from('alerts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return undefined;
      console.error('Erro ao buscar alerta:', error);
      throw error;
    }

    return data ? mapAlertFromDb(data) : undefined;
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    const { data, error } = await supabase!
      .from('alerts')
      .insert(mapAlertToDb(alert))
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar alerta:', error);
      throw error;
    }

    return mapAlertFromDb(data);
  }

  async updateAlert(id: string, updates: Partial<Alert>): Promise<Alert | undefined> {
    const dbUpdates: Record<string, any> = {};
    
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
    if (updates.vehicleId !== undefined) dbUpdates.vehicle_id = updates.vehicleId;
    if (updates.vehicleName !== undefined) dbUpdates.vehicle_name = updates.vehicleName;
    if (updates.message !== undefined) dbUpdates.message = updates.message;
    if (updates.timestamp !== undefined) dbUpdates.timestamp = updates.timestamp;
    if (updates.read !== undefined) dbUpdates.read = updates.read;
    if (updates.latitude !== undefined) dbUpdates.latitude = updates.latitude;
    if (updates.longitude !== undefined) dbUpdates.longitude = updates.longitude;
    if (updates.speed !== undefined) dbUpdates.speed = updates.speed;
    if (updates.speedLimit !== undefined) dbUpdates.speed_limit = updates.speedLimit;
    if (updates.geofenceName !== undefined) dbUpdates.geofence_name = updates.geofenceName;

    const { data, error } = await supabase!
      .from('alerts')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return undefined;
      console.error('Erro ao atualizar alerta:', error);
      throw error;
    }

    return data ? mapAlertFromDb(data) : undefined;
  }

  async markAllAlertsRead(): Promise<void> {
    const { error } = await supabase!
      .from('alerts')
      .update({ read: true })
      .eq('read', false);

    if (error) {
      console.error('Erro ao marcar alertas como lidos:', error);
      throw error;
    }
  }

  async clearReadAlerts(): Promise<void> {
    const { error } = await supabase!
      .from('alerts')
      .delete()
      .eq('read', true);

    if (error) {
      console.error('Erro ao limpar alertas lidos:', error);
      throw error;
    }
  }

  // ==================== TRIPS ====================

  async getTrips(vehicleId: string, startDate: string, endDate: string): Promise<Trip[]> {
    const { data, error } = await supabase!
      .from('trips')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .gte('start_time', startDate)
      .lte('end_time', endDate)
      .order('start_time', { ascending: false });

    if (error) {
      console.error('Erro ao buscar viagens:', error);
      throw error;
    }

    return (data || []).map(mapTripFromDb);
  }

  // ==================== SPEED VIOLATIONS ====================

  async getSpeedViolations(startDate: string, endDate: string): Promise<SpeedViolation[]> {
    const { data, error } = await supabase!
      .from('speed_violations')
      .select('*')
      .gte('timestamp', startDate)
      .lte('timestamp', endDate)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Erro ao buscar violações de velocidade:', error);
      throw error;
    }

    return (data || []).map(mapSpeedViolationFromDb);
  }

  async getSpeedStats(startDate: string, endDate: string): Promise<VehicleStats> {
    const violations = await this.getSpeedViolations(startDate, endDate);

    const byVehicle = new Map<string, { 
      count: number; 
      totalExcess: number; 
      lastViolation: string; 
      name: string 
    }>();

    violations.forEach(v => {
      const existing = byVehicle.get(v.vehicleId);
      if (existing) {
        existing.count++;
        existing.totalExcess += v.excessSpeed;
        if (new Date(v.timestamp) > new Date(existing.lastViolation)) {
          existing.lastViolation = v.timestamp;
        }
      } else {
        byVehicle.set(v.vehicleId, {
          count: 1,
          totalExcess: v.excessSpeed,
          lastViolation: v.timestamp,
          name: v.vehicleName,
        });
      }
    });

    const byDay = new Map<string, number>();
    violations.forEach(v => {
      const day = v.timestamp.split('T')[0];
      byDay.set(day, (byDay.get(day) || 0) + 1);
    });

    const topViolators = Array.from(byVehicle.entries())
      .map(([vehicleId, data]) => ({
        vehicleId,
        vehicleName: data.name,
        totalViolations: data.count,
        averageExcessSpeed: data.totalExcess / data.count,
        lastViolation: data.lastViolation,
      }))
      .sort((a, b) => b.totalViolations - a.totalViolations)
      .slice(0, 10);

    return {
      totalViolations: violations.length,
      vehiclesWithViolations: byVehicle.size,
      averageExcessSpeed: violations.length > 0 
        ? violations.reduce((sum, v) => sum + v.excessSpeed, 0) / violations.length 
        : 0,
      violationsByDay: Array.from(byDay.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      topViolators,
    };
  }
}
