# Guia Passo a Passo - Teste do App Mobile de Rastreamento GPS

Este documento descreve detalhadamente como configurar, executar e testar o aplicativo mobile de rastreamento GPS.

## Índice

1. [Visão Geral](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)
3. [Instalação do App Mobile](#instalação-do-app-mobile)
4. [Configuração do Servidor](#configuração-do-servidor)
5. [Executando o Aplicativo](#executando-o-aplicativo)
6. [Testando a Funcionalidade](#testando-a-funcionalidade)
7. [Verificando os Dados](#verificando-os-dados)
8. [Solução de Problemas](#solução-de-problemas)
9. [Personalizações](#personalizações)

---

## Visão Geral

O aplicativo mobile envia a localização GPS do dispositivo para o servidor a cada **5 segundos**. Os dados enviados incluem:

| Campo | Descrição |
|-------|-----------|
| `licensePlate` | Identificador do veículo (padrão: `APP-MOBILE-001`) |
| `latitude` | Coordenada de latitude |
| `longitude` | Coordenada de longitude |
| `currentSpeed` | Velocidade atual em km/h (calculada automaticamente) |

---

## Pré-requisitos

### Hardware Necessário

- **Dispositivo físico** (recomendado) - Android ou iOS com GPS
- **Emulador** - Android Studio Emulator ou iOS Simulator (para testes)
- **Computador** - Para rodar o servidor e o Expo

### Software Necessário

| Software | Versão | Download |
|----------|--------|----------|
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| npm ou yarn | Incluído no Node.js | - |
| Expo Go (celular) | Última versão | [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent) / [App Store](https://apps.apple.com/app/expo-go/id982107779) |

### Rede

- Dispositivo e servidor **na mesma rede Wi-Fi**
- Porta **5000** liberada no firewall do servidor

---

## Instalação do App Mobile

### Passo 1: Navegar até a pasta do app

```bash
cd my-app
```

### Passo 2: Instalar dependências

```bash
npm install
```

Isso irá instalar:
- `expo` - Framework React Native
- `expo-location` - API de localização GPS
- `expo-router` - Navegação entre telas
- Outras dependências necessárias

### Passo 3: Criar assets placeholder (opcional)

Se não tiver os ícones, crie imagens placeholder na pasta `assets/`:
- `icon.png` (1024x1024 px)
- `splash-icon.png` (512x512 px)
- `adaptive-icon.png` (1024x1024 px)

---

## Configuração do Servidor

### Passo 1: Verificar IP do servidor

Descubra o IP do computador que roda o servidor:

**Windows (PowerShell):**
```powershell
Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.PrefixOrigin -eq "Dhcp" } | Select-Object IPAddress
```

**Linux/Mac:**
```bash
ip addr show | grep "inet " | grep -v "127.0.0.1"
```

Anote o IP (ex: `192.168.1.63`).

### Passo 2: Iniciar o servidor de rastreamento

Na pasta raiz do projeto `controle-frotas`:

```bash
npm run dev
```

O servidor deve estar acessível em `http://192.168.1.63:5000`.

### Passo 3: Testar conexão do servidor

**Windows (PowerShell):**
```powershell
Test-NetConnection -ComputerName 192.168.1.63 -Port 5000
```

Se `TcpTestSucceeded` for `True`, o servidor está acessível.

### Passo 4: Configurar IP no app (se necessário)

Se o IP do seu servidor for diferente de `192.168.1.63`, edite o arquivo:

**Arquivo:** `my-app/lib/tracking-service.ts`

```typescript
// Altere esta linha para o IP do seu servidor
const TRACKING_API_URL = 'http://SEU_IP_AQUI:5000';
```

---

## Executando o Aplicativo

### Opção 1: Expo Go (Mais Rápido - Recomendado)

1. Na pasta `my-app`, execute:
   ```bash
   npx expo start
   ```

2. Um QR Code será exibido no terminal.

3. No celular:
   - **Android**: Abra o app Expo Go e escaneie o QR Code
   - **iOS**: Abra a câmera e escaneie o QR Code

4. O aplicativo será carregado no dispositivo.

### Opção 2: Emulador Android

1. Certifique-se de ter o Android Studio instalado com um emulador configurado.

2. Execute:
   ```bash
   npx expo start --android
   ```

### Opção 3: Simulador iOS (apenas Mac)

1. Certifique-se de ter o Xcode instalado.

2. Execute:
   ```bash
   npx expo start --ios
   ```

---

## Testando a Funcionalidade

### Passo 1: Conceder permissão de localização

Ao abrir o app pela primeira vez:

1. A tela de **Rastreamento** será exibida
2. Clique em **"Iniciar Rastreamento"**
3. Um popup solicitará permissão de localização
4. Clique em **"Permitir"** ou **"Allow"**

### Passo 2: Iniciar o rastreamento

1. Clique no botão verde **"▶️ Iniciar Rastreamento"**

2. Observe os seguintes indicadores:
   - **Status**: Deve mudar para 🟢 **Ativo**
   - **Envios realizados**: Contador que incrementa a cada 5 segundos
   - **Última Localização**: Mostra latitude, longitude e velocidade

### Passo 3: Verificar envio de dados

Após iniciar, você verá:

| Campo | O que observar |
|-------|----------------|
| **Status** | 🟢 Ativo |
| **Envios realizados** | Número incrementando (1, 2, 3...) |
| **Última Localização** | Coordenadas atualizadas |
| **Resposta da API** | "Atualizado" ou "Veículo Criado" |

### Passo 4: Testar em movimento

Para testar a velocidade:

1. Caminhe ou dirija com o dispositivo
2. Observe o campo **"Velocidade"** sendo atualizado
3. Na resposta da API, o status do veículo muda para **"moving"**

### Passo 5: Parar o rastreamento

1. Clique no botão vermelho **"⏹️ Parar Rastreamento"**
2. O status muda para 🔴 **Inativo**
3. Os envios são interrompidos

---

## Verificando os Dados

### No Navegador Web

Abra o painel de controle do sistema:

```
http://192.168.1.63:5000
```

O veículo **APP-MOBILE-001** deve aparecer no mapa com a localização atual.

### Via API (PowerShell)

```powershell
# Listar todos os veículos
Invoke-RestMethod -Uri "http://192.168.1.63:5000/api/vehicles"

# Filtrar pelo veículo do app
$vehicles = Invoke-RestMethod -Uri "http://192.168.1.63:5000/api/vehicles"
$vehicles | Where-Object { $_.licensePlate -eq "APP-MOBILE-001" }
```

### Via API (cURL)

```bash
# Listar todos os veículos
curl http://192.168.1.63:5000/api/vehicles

# Ver detalhes formatados
curl http://192.168.1.63:5000/api/vehicles | jq '.[] | select(.licensePlate == "APP-MOBILE-001")'
```

### Resposta Esperada

```json
{
  "id": "uuid-gerado",
  "name": "Veículo APP-MOBILE-001",
  "licensePlate": "APP-MOBILE-001",
  "status": "moving",
  "ignition": "on",
  "currentSpeed": 15,
  "latitude": -23.550520,
  "longitude": -46.633309,
  "lastUpdate": "2024-01-15T14:30:00.000Z"
}
```

---

## Solução de Problemas

### ❌ "Permissão de localização negada"

**Causa:** O usuário negou a permissão de localização.

**Solução:**

1. Vá nas **Configurações** do dispositivo
2. Encontre o app **Expo Go** na lista de aplicativos
3. Clique em **Permissões** > **Localização**
4. Selecione **"Permitir apenas durante o uso"** ou **"Sempre permitir"**
5. Volte ao app e clique em **"Solicitar Permissão Novamente"**

### ❌ "Falha ao enviar dados de rastreamento"

**Causa:** O servidor não está acessível.

**Solução:**

1. Verifique se o servidor está rodando
2. Confirme que o IP está correto em `lib/tracking-service.ts`
3. Verifique se dispositivo e servidor estão na mesma rede Wi-Fi
4. Teste a conexão na aba **Configurações** do app

### ❌ "Timeout de conexão"

**Causa:** O servidor está bloqueado pelo firewall.

**Solução (Windows):**

```powershell
# Executar como Administrador
New-NetFirewallRule -DisplayName "Controle Frotas API" -Direction Inbound -Protocol TCP -LocalPort 5000 -Action Allow
```

**Solução (Linux):**

```bash
sudo ufw allow 5000/tcp
```

### ❌ Velocidade sempre mostra 0 km/h

**Causa:** O dispositivo está parado ou o GPS não tem precisão.

**Solução:**

1. Ative o **GPS de alta precisão** nas configurações do dispositivo
2. Vá para um **local aberto** (sem teto)
3. **Mova-se** por alguns metros
4. Aguarde 2-3 ciclos de envio (10-15 segundos)

### ❌ App não conecta ao servidor (Android)

**Causa:** Android bloqueia conexões HTTP não seguras por padrão.

**Solução:** O Expo já está configurado para permitir isso. Se ainda houver problemas:

1. Verifique se o IP está correto
2. Confirme que o servidor está escutando em `0.0.0.0` (todas as interfaces)

### ❌ Localização imprecisa

**Solução:**

1. Ative **GPS de alta precisão** no dispositivo
2. Permita acesso à localização **"Sempre"** (não apenas "durante o uso")
3. Aguarde o GPS estabilizar (30 segundos em área aberta)

---

## Personalizações

### Alterar a placa do veículo

**Arquivo:** `my-app/app/(tabs)/index.tsx`

```typescript
// Altere esta constante
const VEHICLE_LICENSE_PLATE = 'SUA-PLACA-AQUI';
```

### Alterar intervalo de envio

**Arquivo:** `my-app/hooks/use-location-tracking.ts`

```typescript
// Altere para o intervalo desejado (em milissegundos)
const TRACKING_INTERVAL_MS = 5000; // 5 segundos
// Exemplos:
// 10000 = 10 segundos
// 30000 = 30 segundos
// 60000 = 1 minuto
```

### Alterar URL do servidor

**Arquivo:** `my-app/lib/tracking-service.ts`

```typescript
// Altere para o IP/URL do seu servidor
const TRACKING_API_URL = 'http://192.168.1.63:5000';
```

---

## Checklist de Teste Final

Marque cada item conforme for testando:

### Instalação e Execução
- [ ] Dependências instaladas com `npm install`
- [ ] App iniciado com `npx expo start`
- [ ] App carregado no dispositivo via Expo Go

### Permissões
- [ ] Permissão de localização concedida
- [ ] GPS ativado no dispositivo

### Rastreamento
- [ ] Botão "Iniciar Rastreamento" funciona
- [ ] Status muda para "Ativo"
- [ ] Contador de envios incrementa a cada 5 segundos
- [ ] Localização é exibida corretamente
- [ ] Resposta da API mostra "success: true"
- [ ] Botão "Parar Rastreamento" funciona

### Verificação no Servidor
- [ ] Veículo aparece na lista de veículos
- [ ] Localização atualiza em tempo real no painel web
- [ ] Campo `lastUpdate` mostra horário recente

### Tratamento de Erros
- [ ] Mensagem exibida se permissão negada
- [ ] Mensagem exibida se servidor indisponível
- [ ] App continua funcionando após erro temporário

---

## Estrutura de Arquivos do App

```
my-app/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx      # Layout das abas
│   │   ├── index.tsx        # Tela principal de rastreamento
│   │   └── settings.tsx     # Tela de configurações
│   └── _layout.tsx          # Layout raiz
├── hooks/
│   └── use-location-tracking.ts  # Hook de rastreamento GPS
├── lib/
│   └── tracking-service.ts  # Serviço de envio para API
├── assets/
│   └── (ícones do app)
├── app.json                 # Configuração do Expo
├── package.json             # Dependências
└── tsconfig.json            # Configuração TypeScript
```

---

## Próximos Passos

Após validar o funcionamento:

1. ✅ Personalizar a placa do veículo
2. ✅ Ajustar o intervalo de envio conforme necessidade
3. ✅ Testar em diferentes dispositivos
4. ✅ Monitorar consumo de bateria em uso prolongado
5. ✅ Gerar build de produção para distribuição

Para gerar um APK de produção:

```bash
cd my-app
npx expo build:android
```

Para gerar um IPA de produção:

```bash
cd my-app
npx expo build:ios
```

