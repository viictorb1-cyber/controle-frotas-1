# Guia de Configuração do Supabase

Este documento descreve como configurar o Supabase para o sistema de Controle de Frotas.

## Sumário

1. [Criando o Projeto no Supabase](#1-criando-o-projeto-no-supabase)
2. [Configurando o Banco de Dados](#2-configurando-o-banco-de-dados)
3. [Configurando Autenticação](#3-configurando-autenticação)
4. [Habilitando Realtime](#4-habilitando-realtime)
5. [Configurando Row Level Security (RLS)](#5-configurando-row-level-security-rls)
6. [Variáveis de Ambiente](#6-variáveis-de-ambiente)
7. [Testando a Integração](#7-testando-a-integração)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Criando o Projeto no Supabase

### Passo 1: Criar uma conta

1. Acesse [https://supabase.com](https://supabase.com)
2. Clique em "Start your project"
3. Faça login com GitHub, GitLab ou email

### Passo 2: Criar um novo projeto

1. No dashboard, clique em "New Project"
2. Preencha os campos:
   - **Name**: `controle-frotas` (ou nome de sua preferência)
   - **Database Password**: Crie uma senha forte (guarde-a!)
   - **Region**: Escolha a região mais próxima de seus usuários (ex: South America - São Paulo)
3. Clique em "Create new project"
4. Aguarde alguns minutos até o projeto ser criado

### Passo 3: Obter as credenciais

Após a criação, vá em **Settings > API** e anote:

- **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
- **anon public key**: Chave pública para o frontend
- **service_role key**: Chave privada para o backend (NUNCA exponha no frontend!)

---

## 2. Configurando o Banco de Dados

### Opção A: Usando o SQL Editor (Recomendado)

1. No dashboard do Supabase, vá em **SQL Editor**
2. Clique em "New query"
3. Copie todo o conteúdo do arquivo [`supabase-schema.sql`](./supabase-schema.sql)
4. Cole no editor e clique em "Run"

### Opção B: Criando tabelas manualmente

Se preferir criar as tabelas pela interface:

1. Vá em **Table Editor**
2. Clique em "New Table" para cada tabela
3. Siga a estrutura definida no arquivo SQL

### Estrutura das Tabelas

#### vehicles (Veículos)
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único (auto-gerado) |
| user_id | UUID | ID do usuário dono |
| name | TEXT | Nome do veículo |
| license_plate | TEXT | Placa do veículo |
| model | TEXT | Modelo (opcional) |
| status | TEXT | moving/stopped/idle/offline |
| ignition | TEXT | on/off |
| current_speed | NUMERIC | Velocidade atual em km/h |
| speed_limit | NUMERIC | Limite de velocidade |
| heading | NUMERIC | Direção em graus |
| latitude | NUMERIC | Coordenada latitude |
| longitude | NUMERIC | Coordenada longitude |
| accuracy | NUMERIC | Precisão do GPS em metros |
| last_update | TIMESTAMPTZ | Última atualização |
| battery_level | NUMERIC | Nível da bateria (opcional) |

#### geofences (Cercas Geográficas)
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único |
| user_id | UUID | ID do usuário dono |
| name | TEXT | Nome da área |
| description | TEXT | Descrição (opcional) |
| type | TEXT | circle ou polygon |
| active | BOOLEAN | Se está ativa |
| center | JSONB | Centro para círculos |
| radius | NUMERIC | Raio em metros |
| points | JSONB | Array de pontos para polígonos |
| rules | JSONB | Regras de alertas |
| vehicle_ids | TEXT[] | IDs dos veículos associados |
| color | TEXT | Cor no mapa |

#### alerts (Alertas)
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único |
| user_id | UUID | ID do usuário |
| type | TEXT | Tipo do alerta |
| priority | TEXT | critical/warning/info |
| vehicle_id | TEXT | ID do veículo |
| vehicle_name | TEXT | Nome do veículo |
| message | TEXT | Mensagem do alerta |
| timestamp | TIMESTAMPTZ | Data/hora |
| read | BOOLEAN | Se foi lido |

#### trips (Viagens)
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único |
| user_id | UUID | ID do usuário |
| vehicle_id | UUID | ID do veículo |
| start_time | TIMESTAMPTZ | Início da viagem |
| end_time | TIMESTAMPTZ | Fim da viagem |
| total_distance | NUMERIC | Distância em metros |
| points | JSONB | Array de pontos GPS |
| events | JSONB | Array de eventos |

#### speed_violations (Violações de Velocidade)
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único |
| user_id | UUID | ID do usuário |
| vehicle_id | UUID | ID do veículo |
| speed | NUMERIC | Velocidade registrada |
| speed_limit | NUMERIC | Limite de velocidade |
| excess_speed | NUMERIC | Excesso de velocidade |
| timestamp | TIMESTAMPTZ | Data/hora |
| latitude | NUMERIC | Coordenada |
| longitude | NUMERIC | Coordenada |

---

## 3. Configurando Autenticação

### Passo 1: Habilitar Email/Password

1. Vá em **Authentication > Providers**
2. Em "Email", certifique-se que está habilitado
3. Configure as opções:
   - **Confirm email**: Recomendado para produção
   - **Secure email change**: Habilitado

### Passo 2: Configurar templates de email (opcional)

1. Vá em **Authentication > Email Templates**
2. Personalize os templates de:
   - Confirmação de email
   - Recuperação de senha
   - Convite de usuário

### Passo 3: Configurar URL do site

1. Vá em **Authentication > URL Configuration**
2. Configure:
   - **Site URL**: URL da sua aplicação (ex: `http://localhost:5000` para dev)
   - **Redirect URLs**: URLs permitidas para redirecionamento

---

## 4. Habilitando Realtime

O Realtime permite que o frontend receba atualizações em tempo real quando os dados mudam.

### Passo 1: Habilitar nas tabelas

1. Vá em **Database > Replication**
2. Em "Realtime", adicione as tabelas:
   - `vehicles`
   - `alerts`
   - `geofences`

### Passo 2: Via SQL (alternativo)

Execute no SQL Editor:

```sql
-- Habilitar realtime para vehicles
ALTER PUBLICATION supabase_realtime ADD TABLE vehicles;

-- Habilitar realtime para alerts
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;

-- Habilitar realtime para geofences
ALTER PUBLICATION supabase_realtime ADD TABLE geofences;
```

---

## 5. Configurando Row Level Security (RLS)

O RLS garante que cada usuário só acesse seus próprios dados.

### Verificar se o RLS está habilitado

1. Vá em **Table Editor**
2. Selecione cada tabela
3. Verifique se "RLS Enabled" está ativo

Se você executou o script SQL completo, o RLS já foi configurado automaticamente.

### Políticas criadas

Cada tabela tem 4 políticas:
- **SELECT**: Usuário pode ver apenas seus próprios registros
- **INSERT**: Usuário pode criar apenas registros com seu user_id
- **UPDATE**: Usuário pode atualizar apenas seus registros
- **DELETE**: Usuário pode deletar apenas seus registros

### Testando as políticas

1. Vá em **Authentication > Users**
2. Crie um usuário de teste
3. No **SQL Editor**, rode uma query filtrando por `auth.uid()`

---

## 6. Variáveis de Ambiente

### Criar arquivo `.env` na raiz do projeto:

```env
# Supabase - Backend (Service Role - NUNCA exponha publicamente!)
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase - Frontend (apenas chaves públicas!)
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Onde encontrar as chaves:

1. **Project URL** e **anon key**: Settings > API > Project URL / anon public
2. **service_role key**: Settings > API > service_role (cuidado! É uma chave secreta)

### Importante sobre segurança:

- A `service_role key` NUNCA deve ser exposta no frontend
- Use a `anon key` no frontend (VITE_SUPABASE_ANON_KEY)
- Use a `service_role key` apenas no backend (SUPABASE_SERVICE_ROLE_KEY)
- Adicione `.env` ao `.gitignore`

---

## 7. Testando a Integração

### 1. Iniciar o servidor

```bash
npm run dev
```

### 2. Verificar logs

O servidor deve mostrar:
```
Usando SupabaseStorage para persistência de dados
```

Se mostrar "Usando MemStorage", verifique as variáveis de ambiente.

### 3. Testar autenticação

1. Acesse `http://localhost:5000/login`
2. Crie uma conta em "Cadastre-se"
3. Verifique o email de confirmação
4. Faça login

### 4. Testar CRUD

1. Após login, adicione um veículo
2. Verifique no Supabase Dashboard (Table Editor > vehicles)
3. O registro deve aparecer com seu `user_id`

### 5. Testar Realtime

1. Abra duas abas do navegador
2. Em uma aba, atualize a posição de um veículo
3. A outra aba deve atualizar automaticamente

---

## 8. Troubleshooting

### Erro: "Supabase não está configurado"

**Causa**: Variáveis de ambiente não encontradas

**Solução**:
1. Verifique se o arquivo `.env` existe na raiz
2. Reinicie o servidor após criar/modificar o `.env`
3. Confirme que os nomes das variáveis estão corretos

### Erro: "Invalid API key"

**Causa**: Chave incorreta ou expirada

**Solução**:
1. Vá em Settings > API no Supabase
2. Copie as chaves novamente
3. Verifique se não há espaços extras

### Erro: "Row Level Security policy violation"

**Causa**: RLS está bloqueando a operação

**Solução**:
1. Verifique se o `user_id` está sendo enviado corretamente
2. Confirme que o usuário está autenticado
3. Revise as políticas de RLS

### Erro: "Realtime not working"

**Causa**: Tabela não está na publicação realtime

**Solução**:
1. Vá em Database > Replication
2. Adicione a tabela ao Realtime
3. Ou execute o SQL: `ALTER PUBLICATION supabase_realtime ADD TABLE nome_tabela;`

### Dados não persistindo

**Causa**: Usando MemStorage ao invés de SupabaseStorage

**Solução**:
1. Verifique os logs do servidor
2. Confirme as variáveis de ambiente
3. Reinicie o servidor

---

## Recursos Adicionais

- [Documentação oficial do Supabase](https://supabase.com/docs)
- [Guia de Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Realtime Subscriptions](https://supabase.com/docs/guides/realtime)
- [Supabase Auth](https://supabase.com/docs/guides/auth)

---

## Checklist de Configuração

- [ ] Projeto criado no Supabase
- [ ] Tabelas criadas (vehicles, geofences, alerts, trips, speed_violations)
- [ ] RLS habilitado em todas as tabelas
- [ ] Políticas de segurança configuradas
- [ ] Autenticação por email habilitada
- [ ] Realtime habilitado para tabelas necessárias
- [ ] Arquivo `.env` configurado com todas as variáveis
- [ ] Servidor iniciando com "SupabaseStorage"
- [ ] Login/cadastro funcionando
- [ ] Dados persistindo no banco

