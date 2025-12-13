# API de Rastreamento GPS

Este documento descreve como utilizar o endpoint de rastreamento para enviar dados de posição de veículos.

## Sumário

1. [Configuração do Servidor](#configuração-do-servidor)
2. [Endpoint](#endpoint)
3. [Requisição](#requisição)
4. [Respostas](#respostas)
5. [Exemplos de Uso](#exemplos-de-uso)
6. [Teste Rápido](#teste-rápido)
7. [Comportamento Automático](#comportamento-automático)
8. [Integração com Rastreadores GPS](#integração-com-rastreadores-gps)
9. [Troubleshooting](#troubleshooting)
10. [Notas Importantes](#notas-importantes)

---

## Configuração do Servidor

| Configuração | Valor |
|--------------|-------|
| **IP do Servidor** | `192.168.1.63` |
| **Porta** | `5000` |
| **URL Base** | `http://192.168.1.63:5000` |
| **Protocolo** | HTTP |

> **Nota**: Certifique-se de que o servidor está em execução e acessível na rede antes de enviar requisições.

---

## Endpoint

```
POST http://192.168.1.63:5000/api/tracking
```

### Descrição

Este endpoint recebe dados de posição enviados por rastreadores GPS ou outros dispositivos de telemetria. O veículo é identificado pela placa e, caso não exista no sistema, será criado automaticamente.

---

## Requisição

### Headers

| Header | Valor |
|--------|-------|
| Content-Type | application/json |

### Body (JSON)

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| licensePlate | string | Sim | Placa do veículo (ex: "ABC-1234") |
| latitude | number | Sim | Latitude da posição (-90 a 90) |
| longitude | number | Sim | Longitude da posição (-180 a 180) |
| currentSpeed | number | Sim | Velocidade atual em km/h (mínimo 0) |

### Exemplo de Body

```json
{
  "licensePlate": "ABC-1234",
  "latitude": -23.5505,
  "longitude": -46.6333,
  "currentSpeed": 65
}
```

---

## Respostas

### 200 OK - Veículo Atualizado

Quando o veículo já existe no sistema e foi atualizado com sucesso.

```json
{
  "success": true,
  "action": "updated",
  "vehicle": {
    "id": "uuid-do-veiculo",
    "name": "Caminhão 01",
    "licensePlate": "ABC-1234",
    "model": "Mercedes Actros",
    "status": "moving",
    "ignition": "on",
    "currentSpeed": 65,
    "speedLimit": 80,
    "heading": 45,
    "latitude": -23.5505,
    "longitude": -46.6333,
    "accuracy": 5,
    "lastUpdate": "2024-01-15T14:30:00.000Z",
    "batteryLevel": 85
  }
}
```

### 201 Created - Veículo Criado

Quando o veículo não existia e foi criado automaticamente.

```json
{
  "success": true,
  "action": "created",
  "vehicle": {
    "id": "novo-uuid",
    "name": "Veículo ABC-1234",
    "licensePlate": "ABC-1234",
    "status": "moving",
    "ignition": "on",
    "currentSpeed": 65,
    "speedLimit": 80,
    "heading": 0,
    "latitude": -23.5505,
    "longitude": -46.6333,
    "accuracy": 5,
    "lastUpdate": "2024-01-15T14:30:00.000Z"
  }
}
```

### 400 Bad Request - Dados Inválidos

Quando os dados enviados não passam na validação.

```json
{
  "error": "Dados de rastreamento inválidos",
  "details": [
    {
      "code": "too_small",
      "minimum": 1,
      "type": "string",
      "inclusive": true,
      "exact": false,
      "message": "Placa é obrigatória",
      "path": ["licensePlate"]
    }
  ]
}
```

### 500 Internal Server Error

Quando ocorre um erro interno no servidor.

```json
{
  "error": "Falha ao processar dados de rastreamento"
}
```

---

## Exemplos de Uso

### cURL

```bash
curl -X POST http://192.168.1.63:5000/api/tracking \
  -H "Content-Type: application/json" \
  -d '{
    "licensePlate": "ABC-1234",
    "latitude": -23.5505,
    "longitude": -46.6333,
    "currentSpeed": 65
  }'
```

### JavaScript (Fetch)

```javascript
const API_URL = 'http://192.168.1.63:5000';

const response = await fetch(`${API_URL}/api/tracking`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    licensePlate: 'ABC-1234',
    latitude: -23.5505,
    longitude: -46.6333,
    currentSpeed: 65,
  }),
});

const data = await response.json();
console.log(data);
```

### Python (Requests)

```python
import requests

API_URL = 'http://192.168.1.63:5000'

response = requests.post(
    f'{API_URL}/api/tracking',
    json={
        'licensePlate': 'ABC-1234',
        'latitude': -23.5505,
        'longitude': -46.6333,
        'currentSpeed': 65,
    }
)

print(response.json())
```

### PowerShell

```powershell
$API_URL = "http://192.168.1.63:5000"

$body = @{
    licensePlate = "ABC-1234"
    latitude = -23.5505
    longitude = -46.6333
    currentSpeed = 65
} | ConvertTo-Json

Invoke-RestMethod -Uri "$API_URL/api/tracking" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

### C# (HttpClient)

```csharp
using System.Net.Http;
using System.Text;
using System.Text.Json;

const string API_URL = "http://192.168.1.63:5000";

using var client = new HttpClient();

var trackingData = new
{
    licensePlate = "ABC-1234",
    latitude = -23.5505,
    longitude = -46.6333,
    currentSpeed = 65
};

var json = JsonSerializer.Serialize(trackingData);
var content = new StringContent(json, Encoding.UTF8, "application/json");

var response = await client.PostAsync($"{API_URL}/api/tracking", content);
var result = await response.Content.ReadAsStringAsync();

Console.WriteLine(result);
```

### Arduino/ESP32 (WiFi)

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "SUA_REDE_WIFI";
const char* password = "SUA_SENHA_WIFI";
const char* serverUrl = "http://192.168.1.63:5000/api/tracking";

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Conectando ao WiFi...");
  }
  Serial.println("WiFi conectado!");
}

void enviarPosicao(String placa, float latitude, float longitude, float velocidade) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    
    // Criar JSON
    StaticJsonDocument<200> doc;
    doc["licensePlate"] = placa;
    doc["latitude"] = latitude;
    doc["longitude"] = longitude;
    doc["currentSpeed"] = velocidade;
    
    String jsonString;
    serializeJson(doc, jsonString);
    
    // Enviar requisição
    int httpResponseCode = http.POST(jsonString);
    
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("Resposta: " + response);
    } else {
      Serial.println("Erro na requisição: " + String(httpResponseCode));
    }
    
    http.end();
  }
}

void loop() {
  // Exemplo: enviar posição a cada 10 segundos
  enviarPosicao("ABC-1234", -23.5505, -46.6333, 65.0);
  delay(10000);
}
```

---

## Teste Rápido

### Verificar se o servidor está acessível

**Windows (PowerShell):**
```powershell
Test-NetConnection -ComputerName 192.168.1.63 -Port 5000
```

**Linux/Mac:**
```bash
nc -zv 192.168.1.63 5000
```

**Ou via cURL:**
```bash
curl -I http://192.168.1.63:5000/api/vehicles
```

### Enviar requisição de teste

Execute este comando para testar o endpoint com dados de exemplo:

**cURL:**
```bash
curl -X POST http://192.168.1.63:5000/api/tracking \
  -H "Content-Type: application/json" \
  -d '{"licensePlate":"TESTE-001","latitude":-23.5505,"longitude":-46.6333,"currentSpeed":0}'
```

**PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://192.168.1.63:5000/api/tracking" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"licensePlate":"TESTE-001","latitude":-23.5505,"longitude":-46.6333,"currentSpeed":0}'
```

Se a resposta contiver `"success": true`, o endpoint está funcionando corretamente.

---

## Comportamento Automático

### Status do Veículo

O sistema calcula automaticamente o status do veículo baseado na velocidade:

| Velocidade | Status | Ignição |
|------------|--------|---------|
| > 0 km/h | moving | on |
| = 0 km/h | stopped | off |

### Criação Automática de Veículos

Quando um veículo com a placa informada não existe no sistema, ele é criado automaticamente com:

- **Nome**: "Veículo {placa}"
- **Limite de Velocidade**: 80 km/h (padrão)
- **Precisão GPS**: 5 metros (padrão)
- **Direção (heading)**: 0 graus (padrão)

Após a criação automática, você pode editar o veículo pela interface do sistema para adicionar mais informações como nome personalizado, modelo, etc.

---

## Integração com Rastreadores GPS

Este endpoint foi projetado para receber dados de dispositivos de rastreamento GPS. A integração típica funciona assim:

1. O rastreador GPS coleta a posição do veículo
2. O dispositivo envia os dados para este endpoint via HTTP POST
3. O sistema atualiza a posição do veículo em tempo real
4. As atualizações são propagadas para todos os clientes conectados via WebSocket

### Frequência de Envio Recomendada

| Situação | Intervalo |
|----------|-----------|
| Veículo em movimento | 5-30 segundos |
| Veículo parado | 1-5 minutos |

---

## Troubleshooting

### Erro: Conexão Recusada (Connection Refused)

**Causa**: O servidor não está em execução ou não está escutando na porta 5000.

**Solução**:
1. Verifique se o servidor está em execução
2. Confirme que o servidor está configurado para escutar no IP `0.0.0.0` (todas as interfaces)
3. Execute o servidor com `npm run dev`

### Erro: Timeout de Conexão

**Causa**: O servidor não está acessível na rede.

**Solução**:
1. Verifique se o dispositivo está na mesma rede (192.168.1.x)
2. Teste a conectividade: `ping 192.168.1.63`
3. Verifique se não há problemas de roteamento na rede

### Erro: Firewall Bloqueando

**Causa**: O firewall do Windows está bloqueando a porta 5000.

**Solução (Windows)**:
```powershell
# Executar como Administrador
New-NetFirewallRule -DisplayName "Controle Frotas API" -Direction Inbound -Protocol TCP -LocalPort 5000 -Action Allow
```

**Solução (Linux)**:
```bash
sudo ufw allow 5000/tcp
```

### Erro: 400 Bad Request

**Causa**: Os dados enviados estão em formato inválido.

**Solução**:
1. Verifique se o JSON está bem formatado
2. Confirme que todos os campos obrigatórios estão presentes
3. Verifique os tipos de dados (latitude/longitude são números, não strings)

### Erro: CORS (Cross-Origin)

**Causa**: Requisição feita de um domínio/origem diferente via navegador.

**Solução**: 
- Para dispositivos IoT/rastreadores, este erro não ocorre (apenas em navegadores)
- Se necessário, configure CORS no servidor

---

## Notas Importantes

1. **Sem Autenticação**: Este endpoint não requer autenticação. Em produção, considere implementar uma API Key ou outro mecanismo de segurança.

2. **Placa Case-Insensitive**: A busca pela placa não diferencia maiúsculas de minúsculas (ABC-1234 = abc-1234).

3. **Timestamp Automático**: O campo `lastUpdate` é preenchido automaticamente com a data/hora do servidor no momento da requisição.

4. **Realtime**: Se o Supabase Realtime estiver configurado, as atualizações serão propagadas automaticamente para todos os clientes conectados.

5. **Rede Local**: O IP `192.168.1.63` é um endereço de rede local. Para acesso externo, configure port forwarding no roteador ou use um serviço de túnel (ex: ngrok).
