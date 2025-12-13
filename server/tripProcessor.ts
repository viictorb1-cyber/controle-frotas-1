import type { Trip, LocationPoint, RouteEvent } from "@shared/schema";
import { randomUUID } from "crypto";

interface TrackingPoint {
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
}

// Calcula a distância entre dois pontos em metros (fórmula de Haversine)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Raio da Terra em metros
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Agrupa pontos de rastreamento em viagens (trips)
export function processTrackingPointsIntoTrips(
  points: TrackingPoint[]
): Trip[] {
  if (points.length === 0) {
    return [];
  }

  const trips: Trip[] = [];
  let currentTrip: {
    vehicleId: string;
    startTime: string;
    endTime: string;
    points: LocationPoint[];
    events: RouteEvent[];
    totalDistance: number;
    maxSpeed: number;
    stoppedTime: number;
    lastStopStart: string | null;
  } | null = null;

  const STOP_THRESHOLD = 5; // km/h - velocidade abaixo disso é considerado parado
  const STOP_DURATION_THRESHOLD = 5 * 60 * 1000; // 5 minutos em ms - tempo mínimo para registrar uma parada
  const TRIP_GAP_THRESHOLD = 30 * 60 * 1000; // 30 minutos em ms - se passar mais tempo, é uma nova viagem

  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const pointTime = new Date(point.recordedAt).getTime();

    // Se não há viagem atual ou passou muito tempo desde o último ponto, inicia nova viagem
    if (!currentTrip) {
      currentTrip = {
        vehicleId: point.vehicleId,
        startTime: point.recordedAt,
        endTime: point.recordedAt,
        points: [],
        events: [],
        totalDistance: 0,
        maxSpeed: point.speed,
        stoppedTime: 0,
        lastStopStart: null,
      };

      // Evento de partida
      currentTrip.events.push({
        id: randomUUID(),
        type: "departure",
        latitude: point.latitude,
        longitude: point.longitude,
        timestamp: point.recordedAt,
      });
    } else {
      const lastPoint = currentTrip.points[currentTrip.points.length - 1];
      const lastPointTime = new Date(lastPoint.timestamp).getTime();
      const timeDiff = pointTime - lastPointTime;

      // Se passou muito tempo, finaliza a viagem atual e inicia uma nova
      if (timeDiff > TRIP_GAP_THRESHOLD) {
        // Evento de chegada
        currentTrip.events.push({
          id: randomUUID(),
          type: "arrival",
          latitude: lastPoint.longitude,
          longitude: lastPoint.latitude,
          timestamp: lastPoint.timestamp,
        });

        // Finaliza a viagem atual
        trips.push(createTripFromData(currentTrip));

        // Inicia nova viagem
        currentTrip = {
          vehicleId: point.vehicleId,
          startTime: point.recordedAt,
          endTime: point.recordedAt,
          points: [],
          events: [],
          totalDistance: 0,
          maxSpeed: point.speed,
          stoppedTime: 0,
          lastStopStart: null,
        };

        currentTrip.events.push({
          id: randomUUID(),
          type: "departure",
          latitude: point.latitude,
          longitude: point.longitude,
          timestamp: point.recordedAt,
        });
      }
    }

    // Adiciona o ponto à viagem atual
    const locationPoint: LocationPoint = {
      latitude: point.latitude,
      longitude: point.longitude,
      speed: point.speed,
      heading: point.heading,
      timestamp: point.recordedAt,
      accuracy: 5,
    };
    currentTrip.points.push(locationPoint);
    currentTrip.endTime = point.recordedAt;

    // Atualiza velocidade máxima
    if (point.speed > currentTrip.maxSpeed) {
      currentTrip.maxSpeed = point.speed;
    }

    // Calcula distância se houver ponto anterior
    if (currentTrip.points.length > 1) {
      const prevPoint = currentTrip.points[currentTrip.points.length - 2];
      const distance = calculateDistance(
        prevPoint.latitude,
        prevPoint.longitude,
        point.latitude,
        point.longitude
      );
      currentTrip.totalDistance += distance;
    }

    // Detecta paradas
    if (point.speed <= STOP_THRESHOLD) {
      if (!currentTrip.lastStopStart) {
        currentTrip.lastStopStart = point.recordedAt;
      }
    } else {
      // Se estava parado e agora está em movimento
      if (currentTrip.lastStopStart) {
        const stopDuration =
          pointTime - new Date(currentTrip.lastStopStart).getTime();
        
        // Só registra paradas com duração mínima
        if (stopDuration >= STOP_DURATION_THRESHOLD) {
          const stopEvent: RouteEvent = {
            id: randomUUID(),
            type: "stop",
            latitude: point.latitude,
            longitude: point.longitude,
            timestamp: currentTrip.lastStopStart,
            duration: stopDuration / 1000 / 60, // converter para minutos
          };
          currentTrip.events.push(stopEvent);
          currentTrip.stoppedTime += stopDuration / 1000 / 60; // minutos
        }
        
        currentTrip.lastStopStart = null;
      }
    }
  }

  // Finaliza a última viagem se existir
  if (currentTrip && currentTrip.points.length > 0) {
    const lastPoint = currentTrip.points[currentTrip.points.length - 1];
    
    // Se ainda está parado no final
    if (currentTrip.lastStopStart) {
      const stopDuration =
        new Date(currentTrip.endTime).getTime() -
        new Date(currentTrip.lastStopStart).getTime();
      
      if (stopDuration >= STOP_DURATION_THRESHOLD) {
        currentTrip.events.push({
          id: randomUUID(),
          type: "stop",
          latitude: lastPoint.latitude,
          longitude: lastPoint.longitude,
          timestamp: currentTrip.lastStopStart,
          duration: stopDuration / 1000 / 60,
        });
        currentTrip.stoppedTime += stopDuration / 1000 / 60;
      }
    }
    
    // Evento de chegada
    currentTrip.events.push({
      id: randomUUID(),
      type: "arrival",
      latitude: lastPoint.latitude,
      longitude: lastPoint.longitude,
      timestamp: lastPoint.timestamp,
    });

    trips.push(createTripFromData(currentTrip));
  }

  return trips;
}

function createTripFromData(tripData: {
  vehicleId: string;
  startTime: string;
  endTime: string;
  points: LocationPoint[];
  events: RouteEvent[];
  totalDistance: number;
  maxSpeed: number;
  stoppedTime: number;
}): Trip {
  const startTime = new Date(tripData.startTime).getTime();
  const endTime = new Date(tripData.endTime).getTime();
  const travelTimeMinutes = (endTime - startTime) / 1000 / 60; // em minutos
  
  // Conta paradas (eventos de tipo 'stop')
  const stopsCount = tripData.events.filter(e => e.type === "stop").length;

  // Calcula velocidade média (distância / tempo de movimento)
  const movementTime = travelTimeMinutes - tripData.stoppedTime;
  const averageSpeed =
    movementTime > 0
      ? (tripData.totalDistance / 1000) / (movementTime / 60) // km/h
      : 0;

  return {
    id: randomUUID(),
    vehicleId: tripData.vehicleId,
    startTime: tripData.startTime,
    endTime: tripData.endTime,
    totalDistance: tripData.totalDistance,
    travelTime: travelTimeMinutes,
    stoppedTime: tripData.stoppedTime,
    averageSpeed: averageSpeed,
    maxSpeed: tripData.maxSpeed,
    stopsCount: stopsCount,
    points: tripData.points,
    events: tripData.events,
  };
}

