import { useState, useEffect, useCallback, useRef } from 'react';
import * as Location from 'expo-location';
import { sendTrackingData, TrackingResponse } from '@/lib/tracking-service';

/** Intervalo de envio em milissegundos (5 segundos) */
const TRACKING_INTERVAL_MS = 5000;

/** Status da permissão de localização */
export type PermissionStatus = 'not_checked' | 'granted' | 'denied' | 'checking';

/** Estado do rastreamento */
export interface TrackingState {
  /** Se o rastreamento está ativo */
  isTracking: boolean;
  /** Status da permissão de localização */
  permissionStatus: PermissionStatus;
  /** Última localização obtida */
  lastLocation: {
    latitude: number;
    longitude: number;
    speed: number; // km/h
    timestamp: Date;
  } | null;
  /** Última resposta da API */
  lastApiResponse: TrackingResponse | null;
  /** Mensagem de erro, se houver */
  error: string | null;
  /** Número de envios realizados */
  sendCount: number;
  /** Se está carregando (obtendo localização) */
  isLoading: boolean;
}

/** Ações disponíveis do hook */
export interface TrackingActions {
  /** Inicia o rastreamento */
  startTracking: () => Promise<void>;
  /** Para o rastreamento */
  stopTracking: () => void;
  /** Solicita permissão de localização */
  requestPermission: () => Promise<boolean>;
  /** Limpa o erro atual */
  clearError: () => void;
}

/** Retorno do hook useLocationTracking */
export type UseLocationTrackingReturn = TrackingState & TrackingActions;

/**
 * Hook personalizado para gerenciar rastreamento de localização GPS
 * 
 * @param licensePlate - Placa do veículo para identificação
 * @returns Estado do rastreamento e ações disponíveis
 * 
 * @example
 * ```tsx
 * function TrackingScreen() {
 *   const {
 *     isTracking,
 *     lastLocation,
 *     startTracking,
 *     stopTracking,
 *     sendCount,
 *   } = useLocationTracking('ABC-1234');
 * 
 *   return (
 *     <View>
 *       <Text>Status: {isTracking ? 'Ativo' : 'Inativo'}</Text>
 *       <Text>Envios: {sendCount}</Text>
 *       <Button 
 *         title={isTracking ? 'Parar' : 'Iniciar'} 
 *         onPress={isTracking ? stopTracking : startTracking}
 *       />
 *     </View>
 *   );
 * }
 * ```
 */
export function useLocationTracking(licensePlate: string): UseLocationTrackingReturn {
  // Estado do rastreamento
  const [isTracking, setIsTracking] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('not_checked');
  const [lastLocation, setLastLocation] = useState<TrackingState['lastLocation']>(null);
  const [lastApiResponse, setLastApiResponse] = useState<TrackingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sendCount, setSendCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Referências para o intervalo e localização anterior
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previousLocationRef = useRef<{ latitude: number; longitude: number; timestamp: number } | null>(null);

  /**
   * Calcula a velocidade em km/h baseado em duas posições
   */
  const calculateSpeed = useCallback((
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
    timeMs: number
  ): number => {
    // Fórmula de Haversine para calcular distância
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c;

    // Tempo em horas
    const timeHours = timeMs / (1000 * 60 * 60);

    // Velocidade em km/h
    if (timeHours === 0) return 0;
    const speed = distanceKm / timeHours;

    // Limitar a velocidade máxima razoável (300 km/h) para evitar erros de GPS
    return Math.min(Math.round(speed), 300);
  }, []);

  /**
   * Solicita permissão de localização
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    setPermissionStatus('checking');
    
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setPermissionStatus(granted ? 'granted' : 'denied');
      
      if (!granted) {
        setError('Permissão de localização negada. Habilite nas configurações do dispositivo.');
      }
      
      return granted;
    } catch (err) {
      console.error('[Tracking] Erro ao solicitar permissão:', err);
      setPermissionStatus('denied');
      setError('Erro ao solicitar permissão de localização');
      return false;
    }
  }, []);

  /**
   * Obtém a localização atual e envia para a API
   */
  const sendCurrentLocation = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Obter localização atual com alta precisão
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;
      const timestamp = Date.now();

      // Calcular velocidade
      let speed = 0;
      
      // Se o dispositivo retornar velocidade, usar diretamente (convertendo m/s para km/h)
      if (location.coords.speed !== null && location.coords.speed > 0) {
        speed = Math.round(location.coords.speed * 3.6);
      } 
      // Senão, calcular baseado na posição anterior
      else if (previousLocationRef.current) {
        const { latitude: prevLat, longitude: prevLon, timestamp: prevTime } = previousLocationRef.current;
        const timeDiff = timestamp - prevTime;
        speed = calculateSpeed(prevLat, prevLon, latitude, longitude, timeDiff);
      }

      // Atualizar referência da posição anterior
      previousLocationRef.current = { latitude, longitude, timestamp };

      // Atualizar estado da localização
      setLastLocation({
        latitude,
        longitude,
        speed,
        timestamp: new Date(timestamp),
      });

      // Enviar para a API
      const response = await sendTrackingData({
        licensePlate,
        latitude,
        longitude,
        currentSpeed: speed,
      });

      setLastApiResponse(response);
      setSendCount((prev) => prev + 1);

      console.log(`[Tracking] Localização enviada: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} - Velocidade: ${speed} km/h`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('[Tracking] Erro:', errorMessage);
      setError(`Falha ao enviar dados: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [licensePlate, calculateSpeed]);

  /**
   * Inicia o rastreamento
   */
  const startTracking = useCallback(async () => {
    // Verificar/solicitar permissão
    let hasPermission = permissionStatus === 'granted';
    
    if (!hasPermission) {
      hasPermission = await requestPermission();
    }

    if (!hasPermission) {
      return;
    }

    // Limpar intervalo anterior se existir
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Resetar contadores
    setSendCount(0);
    previousLocationRef.current = null;
    setError(null);

    // Iniciar rastreamento
    setIsTracking(true);
    console.log('[Tracking] Iniciado - Enviando localização a cada 5 segundos');

    // Enviar primeira localização imediatamente
    await sendCurrentLocation();

    // Configurar intervalo para envios subsequentes
    intervalRef.current = setInterval(sendCurrentLocation, TRACKING_INTERVAL_MS);
  }, [permissionStatus, requestPermission, sendCurrentLocation]);

  /**
   * Para o rastreamento
   */
  const stopTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setIsTracking(false);
    console.log('[Tracking] Parado');
  }, []);

  /**
   * Limpa o erro atual
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Limpar intervalo ao desmontar o componente
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Verificar permissão ao montar
  useEffect(() => {
    const checkPermission = async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      setPermissionStatus(status === 'granted' ? 'granted' : 'not_checked');
    };
    checkPermission();
  }, []);

  return {
    // Estado
    isTracking,
    permissionStatus,
    lastLocation,
    lastApiResponse,
    error,
    sendCount,
    isLoading,
    // Ações
    startTracking,
    stopTracking,
    requestPermission,
    clearError,
  };
}

