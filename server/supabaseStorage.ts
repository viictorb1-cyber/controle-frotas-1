import { supabase, isSupabaseConfigured } from './lib/supabase';
import type { 
  Vehicle, InsertVehicle,
  Geofence, InsertGeofence,
  Alert, InsertAlert,
  Trip, SpeedViolation, VehicleStats,
  User, InsertUser
} from '@shared/schema';
import type { IStorage } from './storage';
import bcrypt from 'bcrypt';

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
    center: row.center,
    radius: row.radius,
    points: row.points,
    rules: row.rules,
    vehicleIds: row.vehicle_ids,
    lastTriggered: row.last_triggered,
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
    center: geofence.center,
    radius: geofence.radius,
    points: geofence.points,
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
    latitude: row.latitude,
    longitude: row.longitude,
    speed: row.speed,
    speedLimit: row.speed_limit,
    geofenceName: row.geofence_name,
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
  async getVehicles(): Promise<Vehicle[]> {
    const { data, error } = await supabase!
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false });

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

    if (error || !data) {
      return undefined;
    }

    return mapVehicleFromDb(data);
  }

  async getVehicleByLicensePlate(licensePlate: string): Promise<Vehicle | undefined> {
    const { data, error } = await supabase!
      .from('vehicles')
      .select('*')
      .eq('license_plate', licensePlate)
      .single();

    if (error || !data) {
      return undefined;
    }

    return mapVehicleFromDb(data);
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
    const { data, error } = await supabase!
      .from('vehicles')
      .update(mapVehicleToDb(updates))
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      return undefined;
    }

    return mapVehicleFromDb(data);
  }

  async deleteVehicle(id: string): Promise<boolean> {
    const { error } = await supabase!
      .from('vehicles')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar veículo:', error);
      return false;
    }

    return true;
  }

  async getGeofences(): Promise<Geofence[]> {
    const { data, error } = await supabase!
      .from('geofences')
      .select('*')
      .order('created_at', { ascending: false });

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

    if (error || !data) {
      return undefined;
    }

    return mapGeofenceFromDb(data);
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
    const { data, error } = await supabase!
      .from('geofences')
      .update(mapGeofenceToDb(updates))
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      return undefined;
    }

    return mapGeofenceFromDb(data);
  }

  async deleteGeofence(id: string): Promise<boolean> {
    const { error } = await supabase!
      .from('geofences')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar geofence:', error);
      return false;
    }

    return true;
  }

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

    if (error || !data) {
      return undefined;
    }

    return mapAlertFromDb(data);
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
    const { data, error } = await supabase!
      .from('alerts')
      .update(mapAlertToDb(updates))
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      return undefined;
    }

    return mapAlertFromDb(data);
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

  async getTrips(vehicleId: string, startDate: string, endDate: string): Promise<Trip[]> {
    const { data, error } = await supabase!
      .from('trips')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .gte('start_time', startDate)
      .lte('end_time', endDate)
      .order('start_time', { ascending: false });

    if (error) {
      console.error('Erro ao buscar trips:', error);
      throw error;
    }

    return (data || []).map(row => ({
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
      points: row.points,
      events: row.events,
    }));
  }

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

  async saveTrackingPoint(data: {
    vehicleId: string;
    licensePlate: string;
    latitude: number;
    longitude: number;
    speed: number;
    heading?: number;
    accuracy?: number;
    status?: string;
    ignition?: string;
    batteryLevel?: number;
    source?: string;
  }): Promise<{ id: string }> {
    const { data: result, error } = await supabase!
      .from('tracking_history')
      .insert({
        vehicle_id: data.vehicleId,
        license_plate: data.licensePlate,
        latitude: data.latitude,
        longitude: data.longitude,
        speed: data.speed,
        heading: data.heading || 0,
        accuracy: data.accuracy || 5,
        status: data.status || (data.speed > 5 ? 'moving' : data.speed > 0 ? 'idle' : 'stopped'),
        ignition: data.ignition || (data.speed > 0 ? 'on' : 'off'),
        battery_level: data.batteryLevel || null,
        source: data.source || 'mobile_app',
      })
      .select('id')
      .single();

    if (error) {
      console.error('Erro ao salvar ponto de rastreamento:', error);
      throw error;
    }

    return { id: result.id };
  }

  async getTrackingHistory(
    vehicleId: string, 
    startDate: string, 
    endDate: string,
    limit: number = 1000
  ): Promise<Array<{
    id: string;
    vehicleId: string;
    licensePlate: string;
    latitude: number;
    longitude: number;
    speed: number;
    heading: number;
    status: string;
    ignition: string;
    recordedAt: string;
  }>> {
    const { data, error } = await supabase!
      .from('tracking_history')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .gte('recorded_at', startDate)
      .lte('recorded_at', endDate)
      .order('recorded_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Erro ao buscar histórico de rastreamento:', error);
      throw error;
    }

    return (data || []).map(row => ({
      id: row.id,
      vehicleId: row.vehicle_id,
      licensePlate: row.license_plate,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      speed: Number(row.speed),
      heading: Number(row.heading),
      status: row.status,
      ignition: row.ignition,
      recordedAt: row.recorded_at,
    }));
  }

  // User Authentication methods
  async getUser(username: string): Promise<User | undefined> {
    const { data, error } = await supabase!
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !data) {
      return undefined;
    }

    return {
      id: data.id,
      username: data.username,
      password: data.password,
      role: data.role,
      createdAt: data.created_at,
    };
  }

  async getUserById(id: string): Promise<User | undefined> {
    const { data, error } = await supabase!
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return undefined;
    }

    return {
      id: data.id,
      username: data.username,
      password: data.password,
      role: data.role,
      createdAt: data.created_at,
    };
  }

  async createUser(user: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    
    const { data, error } = await supabase!
      .from('users')
      .insert({
        username: user.username,
        password: hashedPassword,
        role: user.role || 'user',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar usuário:', error);
      throw error;
    }

    return {
      id: data.id,
      username: data.username,
      password: data.password,
      role: data.role,
      createdAt: data.created_at,
    };
  }

  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase!
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar usuários:', error);
      throw error;
    }

    return (data || []).map(row => ({
      id: row.id,
      username: row.username,
      password: row.password,
      role: row.role,
      createdAt: row.created_at,
    }));
  }

  async deleteUser(id: string): Promise<boolean> {
    const { error } = await supabase!
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar usuário:', error);
      return false;
    }

    return true;
  }
}
