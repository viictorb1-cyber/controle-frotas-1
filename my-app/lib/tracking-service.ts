/**
 * Serviço de Rastreamento GPS
 * 
 * Este serviço é responsável por enviar dados de localização
 * para a API de rastreamento do servidor.
 */

// Configuração da API - Altere para o IP do seu servidor
const TRACKING_API_URL = 'http://192.168.1.63:5000';
const TRACKING_ENDPOINT = '/api/tracking';

/**
 * Dados de rastreamento enviados para a API
 */
export interface TrackingData {
  /** Placa do veículo (ex: "ABC-1234") */
  licensePlate: string;
  /** Latitude da posição (-90 a 90) */
  latitude: number;
  /** Longitude da posição (-180 a 180) */
  longitude: number;
  /** Velocidade atual em km/h (mínimo 0) */
  currentSpeed: number;
}

/**
 * Resposta da API de rastreamento
 */
export interface TrackingResponse {
  success: boolean;
  action: 'created' | 'updated';
  vehicle: {
    id: string;
    name: string;
    licensePlate: string;
    status: string;
    ignition: string;
    currentSpeed: number;
    latitude: number;
    longitude: number;
    lastUpdate: string;
  };
}

/**
 * Resposta de erro da API
 */
export interface TrackingError {
  error: string;
  details?: Array<{
    code: string;
    message: string;
    path: string[];
  }>;
}

/**
 * Envia dados de rastreamento para o servidor
 * 
 * @param data - Dados de localização do veículo
 * @returns Resposta da API com informações do veículo
 * @throws Error se a requisição falhar
 * 
 * @example
 * ```typescript
 * const response = await sendTrackingData({
 *   licensePlate: 'ABC-1234',
 *   latitude: -23.5505,
 *   longitude: -46.6333,
 *   currentSpeed: 65
 * });
 * console.log(response.vehicle.status); // 'moving'
 * ```
 */
export async function sendTrackingData(data: TrackingData): Promise<TrackingResponse> {
  console.log('[API] Enviando dados:', JSON.stringify(data));
  
  try {
    const response = await fetch(`${TRACKING_API_URL}${TRACKING_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    console.log('[API] Status:', response.status);

    if (!response.ok) {
      const errorData: TrackingError = await response.json();
      console.error('[API] Erro:', JSON.stringify(errorData));
      throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
    }

    const result: TrackingResponse = await response.json();
    console.log('[API] Resposta:', JSON.stringify(result));
    
    return result;
  } catch (error) {
    if (error instanceof Error) {
      console.error('[API] Erro de rede:', error.message);
      throw error;
    }
    console.error('[API] Erro desconhecido:', error);
    throw new Error('Erro desconhecido ao enviar dados de rastreamento');
  }
}

/**
 * Testa a conexão com o servidor de rastreamento
 * 
 * @returns true se o servidor está acessível
 */
export async function testServerConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${TRACKING_API_URL}/api/vehicles`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.ok;
  } catch (error) {
    console.error('[API] Erro ao testar conexão:', error);
    return false;
  }
}

/**
 * Retorna a URL da API de rastreamento
 */
export function getTrackingApiUrl(): string {
  return TRACKING_API_URL;
}

