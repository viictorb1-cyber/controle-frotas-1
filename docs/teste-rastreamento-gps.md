# Guia de Teste - Rastreamento GPS

Este documento descreve o passo a passo para testar a funcionalidade de rastreamento GPS do aplicativo.

> **📱 Novo!** Veja também o [Guia Completo do App Mobile](./guia-teste-app-mobile.md) para instruções detalhadas de instalação e teste.

## Sumário

1. [Pré-requisitos](#pré-requisitos)
2. [Configuração do Ambiente](#configuração-do-ambiente)
3. [Iniciando o Aplicativo](#iniciando-o-aplicativo)
4. [Testando a Funcionalidade](#testando-a-funcionalidade)
5. [Verificando os Dados no Servidor](#verificando-os-dados-no-servidor)
6. [Troubleshooting](#troubleshooting)

---

## Pré-requisitos

### Hardware
- Dispositivo Android ou iOS (físico recomendado para GPS real)
- Emulador Android/iOS (para testes com localização simulada)

### Software
- Node.js 18+ instalado
- Expo CLI (`npm install -g expo-cli`)
- Expo Go instalado no dispositivo (para testes rápidos)
- Servidor de tracking rodando em `http://192.168.1.63:5000`

### Rede
- Dispositivo e servidor na mesma rede local (192.168.1.x)
- Porta 5000 liberada no firewall do servidor

---

## Configuração do Ambiente

### 1. Verificar conexão com o servidor

**Windows (PowerShell):**
```powershell
Test-NetConnection -ComputerName 192.168.1.63 -Port 5000
```

**Linux/Mac:**
```bash
nc -zv 192.168.1.63 5000
```

Se a conexão falhar, verifique:
- Se o servidor está em execução
- Se estão na mesma rede
- Se o firewall permite a porta 5000

### 2. Instalar dependências

```bash
cd my-app
npm install
```

---

## Iniciando o Aplicativo

### Opção 1: Expo Go (Recomendado para testes rápidos)

```bash
cd my-app
npx expo start
```

Escaneie o QR Code com o app Expo Go no seu dispositivo.

### Opção 2: Development Build

```bash
# Android
npx expo run:android

# iOS
npx expo run:ios
```

---

## Testando a Funcionalidade

### Passo 1: Abrir a tela inicial

Ao abrir o app, você verá a tela inicial com a seção **"🛰️ Rastreamento GPS"**.

### Passo 2: Verificar status da permissão

O status da permissão será exibido:
- **Não verificado**: Permissão ainda não foi solicitada
- **Concedida**: App tem permissão de localização
- **Negada**: Permissão foi negada pelo usuário

### Passo 3: Iniciar o rastreamento

1. Clique no botão **"▶️ Iniciar Rastreamento"**
2. Se a permissão não foi concedida, um popup pedirá permissão
3. Permita o acesso à localização

### Passo 4: Verificar o funcionamento

Após iniciar, você verá:

| Campo | Descrição |
|-------|-----------|
| **Status** | 🟢 Ativo |
| **Envios realizados** | Contador incrementando a cada 5 segundos |
| **Última Localização** | Latitude, longitude e velocidade |
| **Última resposta da API** | Confirmação do servidor |

### Passo 5: Testar em movimento (dispositivo físico)

Para um teste completo:
1. Inicie o rastreamento
2. Caminhe ou dirija com o dispositivo
3. Observe a velocidade sendo calculada e atualizada
4. Verifique os dados no servidor

### Passo 6: Parar o rastreamento

Clique no botão **"⏹️ Parar Rastreamento"** para encerrar.

---

## Verificando os Dados no Servidor

### 1. Testar conectividade antes de iniciar

**Teste rápido de envio manual (PowerShell):**
```powershell
$body = @{
    licensePlate = "TESTE-MANUAL"
    latitude = -23.5505
    longitude = -46.6333
    currentSpeed = 0
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://192.168.1.63:5000/api/tracking" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body
```

Se retornar `"success": true`, o servidor está funcionando.

### 2. Listar todos os veículos

**Via cURL:**
```bash
curl http://192.168.1.63:5000/api/vehicles
```

**Via PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://192.168.1.63:5000/api/vehicles"
```

### 3. O que procurar

Procure por um veículo com a placa **APP-MOBILE-001** na lista. Exemplo de resposta:

```json
{
  "id": "uuid-do-veiculo",
  "name": "Veículo APP-MOBILE-001",
  "licensePlate": "APP-MOBILE-001",
  "status": "moving",
  "ignition": "on",
  "currentSpeed": 15,
  "latitude": -23.5505,
  "longitude": -46.6333,
  "lastUpdate": "2024-01-15T14:30:00.000Z"
}
```

---

## Testando com Localização Simulada

### Android Emulator

1. Abra o emulador Android
2. Clique em **"..."** (Extended Controls)
3. Vá em **Location**
4. Defina latitude e longitude manualmente
5. Clique em **Send**

### iOS Simulator

1. No menu do Simulator: **Features > Location > Custom Location**
2. Insira latitude e longitude
3. Confirme

### Simulando movimento

Para simular movimento e testar velocidade:
1. Defina uma localização inicial
2. Aguarde 5 segundos
3. Defina uma nova localização próxima
4. A velocidade será calculada automaticamente

---

## Checklist de Testes

### Testes Básicos

- [ ] App inicia sem erros
- [ ] Seção de rastreamento é exibida
- [ ] Botão de iniciar rastreamento funciona
- [ ] Permissão de localização é solicitada
- [ ] Localização é obtida após permissão
- [ ] Dados são enviados a cada 5 segundos
- [ ] Resposta da API é exibida
- [ ] Botão de parar rastreamento funciona
- [ ] Contador de envios incrementa corretamente

### Testes de Erro

- [ ] Mensagem exibida se permissão negada
- [ ] Mensagem exibida se servidor indisponível
- [ ] App não trava se houver erro de rede
- [ ] Tracking continua após erro temporário

### Testes de Performance

- [ ] Não há atraso perceptível na UI
- [ ] Consumo de bateria aceitável
- [ ] Memória não aumenta continuamente

---

## Troubleshooting

### Erro: "Permissão de localização negada"

**Solução:**
1. Vá nas configurações do dispositivo
2. Encontre o app na lista de aplicativos
3. Habilite permissão de localização
4. Volte ao app e clique em "Solicitar Permissão Novamente"

### Erro: "Falha ao enviar dados de rastreamento"

**Causas possíveis:**
- Servidor não está rodando
- Dispositivo não está na mesma rede
- Firewall bloqueando conexão

**Solução:**
1. Verifique se o servidor está ativo
2. Teste a conexão manualmente (veja seção de configuração)
3. Verifique as configurações de rede/Wi-Fi

### Erro: "Timeout de conexão"

**Solução:**
1. Verifique se está conectado ao Wi-Fi correto
2. Verifique se o IP do servidor está correto no código
3. Teste ping para o servidor

### Localização imprecisa

**Solução:**
1. Ative GPS de alta precisão no dispositivo
2. Vá para um local aberto (sem teto)
3. Aguarde o GPS estabilizar

### Velocidade sempre zero

**Causas possíveis:**
- Dispositivo parado
- Intervalo muito curto entre movimentos
- GPS sem precisão suficiente

**Solução:**
1. Mova-se por alguns metros
2. Aguarde pelo menos 2 ciclos de envio (10 segundos)

---

## Logs de Debug

Para ver logs detalhados no console:

1. Abra o terminal onde o Expo está rodando
2. Os logs aparecerão automaticamente:

```
[Tracking] Iniciado - Enviando localização a cada 5 segundos
[Tracking] Localização enviada: -23.550520, -46.633309 - Velocidade: 0 km/h
[Tracking] Localização enviada: -23.550521, -46.633310 - Velocidade: 2 km/h
```

Para ver logs no dispositivo:
- **Android**: `adb logcat | grep Tracking`
- **iOS**: Xcode > Debug > Open System Log

---

## Configurações Personalizáveis

### Alterar placa do veículo

No arquivo `app/(tabs)/index.tsx`, altere a placa:

```typescript
const { ... } = useLocationTracking('SUA-PLACA-AQUI');
```

### Alterar intervalo de envio

No arquivo `hooks/use-location-tracking.ts`, altere:

```typescript
const TRACKING_INTERVAL_MS = 5000; // 5 segundos (altere conforme necessário)
```

### Alterar URL do servidor

No arquivo `lib/tracking-service.ts`, altere:

```typescript
const TRACKING_API_URL = 'http://192.168.1.63:5000'; // Altere para seu servidor
```

---

## Verificando Comunicação com a Aplicação Web

### Problema: App mostra "Ativo" mas web não recebe

Se o aplicativo mostra status "Ativo" mas a aplicação web não está recebendo os dados:

#### 1. Verificar console do Expo

No terminal onde o Expo está rodando, procure por mensagens como:

```
[Tracking] Localização enviada: -23.550520, -46.633309 - Velocidade: 0 km/h
```

Se aparecer **"[Tracking] Erro:"**, anote a mensagem de erro.

#### 2. Verificar se o servidor recebeu os dados

Execute este comando para ver o veículo específico:

**PowerShell:**
```powershell
$vehicles = Invoke-RestMethod -Uri "http://192.168.1.63:5000/api/vehicles"
$vehicles | Where-Object { $_.licensePlate -eq "APP-MOBILE-001" }
```

**cURL:**
```bash
curl http://192.168.1.63:5000/api/vehicles | grep -A 10 "APP-MOBILE-001"
```

#### 3. Verificar timestamp de atualização

Compare o campo `lastUpdate` do veículo com o horário atual. Se estiver muito antigo, os dados não estão chegando.

#### 4. Testar envio manual do celular

No navegador do celular, acesse:
```
http://192.168.1.63:5000/api/vehicles
```

Se não carregar, o celular não consegue acessar o servidor. Verifique:
- Celular está no Wi-Fi correto
- Servidor e celular na mesma rede
- Firewall não está bloqueando

#### 5. Adicionar logs detalhados

Para debug avançado, adicione logs no arquivo `lib/tracking-service.ts`:

```typescript
export async function sendTrackingData(data: TrackingData): Promise<TrackingResponse> {
  console.log('[API] Enviando dados:', JSON.stringify(data));
  
  try {
    const response = await fetch(`${TRACKING_API_URL}${TRACKING_ENDPOINT}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    console.log('[API] Status:', response.status);
    
    const result = await response.json();
    console.log('[API] Resposta:', JSON.stringify(result));
    
    return result;
  } catch (error) {
    console.error('[API] Erro de rede:', error);
    throw error;
  }
}
```

---

## Arquivos da Implementação

| Arquivo | Descrição |
|---------|-----------|
| `lib/tracking-service.ts` | Serviço que envia dados para a API |
| `hooks/use-location-tracking.ts` | Hook React que gerencia localização e envio |
| `app/(tabs)/index.tsx` | Tela principal com interface de controle |
| `app.json` | Configuração de permissões de localização |

---

## Próximos Passos

Após validar o funcionamento:

1. ✅ Teste em diferentes condições de rede
2. ✅ Teste em diferentes dispositivos
3. ✅ Monitore consumo de bateria
4. ✅ Valide dados no painel de controle do servidor
5. ✅ Verifique se a aplicação web atualiza em tempo real

