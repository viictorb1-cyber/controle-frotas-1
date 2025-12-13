# Correção do Histórico de Viagens (Trips)

**Data:** 13/12/2025  
**Problema:** Ao buscar um veículo na página de histórico, não estava gerando/exibindo trajetos (trips).

## 🔍 Diagnóstico do Problema

O sistema estava salvando corretamente os pontos de rastreamento GPS na tabela `tracking_history`, mas **não havia nenhum processo** que convertesse esses pontos em viagens (trips) estruturadas.

### O que estava acontecendo:

1. ✅ O app mobile enviava dados de localização via `/api/tracking`
2. ✅ Os dados eram salvos na tabela `tracking_history`
3. ❌ A tabela `trips` ficava vazia (sem processamento)
4. ❌ O endpoint `/api/trips` retornava array vazio
5. ❌ A página de histórico mostrava "Nenhum trajeto encontrado"

## 🛠️ Solução Implementada

### 1. Criação do Processador de Trips (`server/tripProcessor.ts`)

Implementei um módulo completo para processar pontos de rastreamento e gerar viagens estruturadas:

**Funcionalidades:**

- **Agrupamento de pontos em viagens**: Agrupa pontos consecutivos em viagens únicas
- **Detecção de gaps temporais**: Viagens separadas por mais de 30 minutos são consideradas distintas
- **Cálculo de distância**: Usa a fórmula de Haversine para calcular distâncias reais entre pontos
- **Detecção de paradas**: Identifica quando o veículo fica parado por mais de 5 minutos
- **Eventos de viagem**: Gera eventos de partida, chegada e paradas
- **Métricas calculadas**:
  - Distância total percorrida
  - Tempo de viagem (movimento + parado)
  - Tempo parado
  - Velocidade média
  - Velocidade máxima
  - Contagem de paradas

**Parâmetros configuráveis:**

```typescript
const STOP_THRESHOLD = 5; // km/h - abaixo disso é considerado parado
const STOP_DURATION_THRESHOLD = 5 * 60 * 1000; // 5 min - tempo mínimo para registrar parada
const TRIP_GAP_THRESHOLD = 30 * 60 * 1000; // 30 min - gap entre viagens diferentes
```

### 2. Atualização do SupabaseStorage

Modifiquei o método `getTrips()` para:

1. **Primeira tentativa**: Buscar trips já processados na tabela `trips`
2. **Fallback**: Se não existirem trips, processar o histórico dinamicamente
3. **Log detalhado**: Registra o processo de geração para debugging

```typescript
async getTrips(vehicleId: string, startDate: string, endDate: string): Promise<Trip[]> {
  // Tenta buscar trips processados
  const { data, error } = await supabase!.from('trips')...
  
  if (data && data.length > 0) {
    return data.map(mapTripFromDb);
  }

  // Se não existem, processa o histórico
  const trackingHistory = await this.getTrackingHistory(...);
  const { processTrackingPointsIntoTrips } = await import('./tripProcessor');
  return processTrackingPointsIntoTrips(trackingHistory);
}
```

## 📊 Como Funciona Agora

### Fluxo de Dados:

```
[App Mobile] 
    ↓ (envia localização)
[POST /api/tracking]
    ↓ (salva ponto)
[tracking_history]
    ↓ (quando buscar histórico)
[GET /api/trips]
    ↓ (processa pontos)
[tripProcessor]
    ↓ (retorna trips)
[Página History]
    ↓ (exibe mapa e dados)
[Usuário visualiza trajeto]
```

### Estrutura de um Trip Gerado:

```typescript
{
  id: "uuid-gerado",
  vehicleId: "id-do-veiculo",
  startTime: "2025-12-13T08:00:00Z",
  endTime: "2025-12-13T10:30:00Z",
  totalDistance: 45000, // 45 km em metros
  travelTime: 150, // 150 minutos total
  stoppedTime: 30, // 30 minutos parado
  averageSpeed: 35.5, // km/h
  maxSpeed: 80, // km/h
  stopsCount: 3,
  points: [
    { latitude, longitude, speed, heading, timestamp, accuracy },
    // ... mais pontos
  ],
  events: [
    { type: "departure", latitude, longitude, timestamp },
    { type: "stop", latitude, longitude, timestamp, duration: 10 },
    { type: "arrival", latitude, longitude, timestamp }
  ]
}
```

## ✅ Resultado

Agora quando o usuário:

1. Seleciona um veículo na página de Histórico
2. Escolhe um período de datas
3. O sistema:
   - Busca pontos de rastreamento do período
   - Processa automaticamente em viagens
   - Exibe o trajeto no mapa
   - Mostra estatísticas detalhadas (distância, tempo, paradas)
   - Lista eventos da viagem

## 🚀 Melhorias Futuras (Opcional)

Para otimizar ainda mais:

1. **Processamento em background**: Criar um job que processa trips periodicamente
2. **Cache de trips**: Salvar trips processados na tabela `trips` para consultas futuras
3. **WebSocket para processamento**: Processar trips em tempo real conforme pontos chegam
4. **Análise avançada**: Detectar rotas frequentes, comportamento de direção, etc.

## 🧪 Como Testar

1. Certifique-se de que o app mobile está enviando dados de localização
2. Aguarde acumular alguns pontos (pelo menos 5-10 minutos de movimentação)
3. Acesse a página de Histórico no webapp
4. Selecione o veículo que estava sendo rastreado
5. Selecione o período (hoje, por exemplo)
6. O trajeto deve ser exibido no mapa com todas as estatísticas

## 📝 Arquivos Modificados

- `server/tripProcessor.ts` (novo arquivo)
- `server/supabaseStorage.ts` (modificado método `getTrips`)

## 🔧 Observações Técnicas

- O processamento é feito sob demanda (lazy) para evitar overhead
- Limite de 5000 pontos por consulta para evitar sobrecarga
- Algoritmo otimizado para processar grandes volumes de dados
- Compatível com o schema existente do Supabase

