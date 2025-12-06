-- ============================================
-- Schema do Banco de Dados - Controle de Frotas
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- Habilitar extensão UUID se não existir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABELA: vehicles (Veículos)
-- ============================================
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    license_plate TEXT NOT NULL,
    model TEXT,
    status TEXT NOT NULL CHECK (status IN ('moving', 'stopped', 'idle', 'offline')) DEFAULT 'offline',
    ignition TEXT NOT NULL CHECK (ignition IN ('on', 'off')) DEFAULT 'off',
    current_speed NUMERIC NOT NULL DEFAULT 0,
    speed_limit NUMERIC NOT NULL DEFAULT 80,
    heading NUMERIC NOT NULL DEFAULT 0,
    latitude NUMERIC NOT NULL,
    longitude NUMERIC NOT NULL,
    accuracy NUMERIC NOT NULL DEFAULT 5,
    last_update TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    battery_level NUMERIC,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para vehicles
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_last_update ON vehicles(last_update);

-- ============================================
-- TABELA: geofences (Cercas Geográficas)
-- ============================================
CREATE TABLE IF NOT EXISTS geofences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('circle', 'polygon')),
    active BOOLEAN NOT NULL DEFAULT true,
    center JSONB, -- { latitude: number, longitude: number }
    radius NUMERIC, -- em metros, para círculos
    points JSONB, -- array de { latitude: number, longitude: number }, para polígonos
    rules JSONB NOT NULL DEFAULT '[]'::jsonb, -- array de regras
    vehicle_ids TEXT[] NOT NULL DEFAULT '{}',
    last_triggered TIMESTAMPTZ,
    color TEXT DEFAULT '#3b82f6',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para geofences
CREATE INDEX IF NOT EXISTS idx_geofences_user_id ON geofences(user_id);
CREATE INDEX IF NOT EXISTS idx_geofences_active ON geofences(active);

-- ============================================
-- TABELA: alerts (Alertas)
-- ============================================
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('speed', 'geofence_entry', 'geofence_exit', 'geofence_dwell', 'system')),
    priority TEXT NOT NULL CHECK (priority IN ('critical', 'warning', 'info')) DEFAULT 'info',
    vehicle_id TEXT NOT NULL,
    vehicle_name TEXT NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read BOOLEAN NOT NULL DEFAULT false,
    latitude NUMERIC,
    longitude NUMERIC,
    speed NUMERIC,
    speed_limit NUMERIC,
    geofence_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para alerts
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_read ON alerts(read);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(type);
CREATE INDEX IF NOT EXISTS idx_alerts_priority ON alerts(priority);

-- ============================================
-- TABELA: trips (Viagens)
-- ============================================
CREATE TABLE IF NOT EXISTS trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    total_distance NUMERIC NOT NULL DEFAULT 0, -- em metros
    travel_time NUMERIC NOT NULL DEFAULT 0, -- em minutos
    stopped_time NUMERIC NOT NULL DEFAULT 0, -- em minutos
    average_speed NUMERIC NOT NULL DEFAULT 0,
    max_speed NUMERIC NOT NULL DEFAULT 0,
    stops_count INTEGER NOT NULL DEFAULT 0,
    points JSONB NOT NULL DEFAULT '[]'::jsonb, -- array de LocationPoint
    events JSONB NOT NULL DEFAULT '[]'::jsonb, -- array de RouteEvent
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para trips
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_vehicle_id ON trips(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_trips_start_time ON trips(start_time);

-- ============================================
-- TABELA: speed_violations (Violações de Velocidade)
-- ============================================
CREATE TABLE IF NOT EXISTS speed_violations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    vehicle_name TEXT NOT NULL,
    speed NUMERIC NOT NULL,
    speed_limit NUMERIC NOT NULL,
    excess_speed NUMERIC NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    latitude NUMERIC NOT NULL,
    longitude NUMERIC NOT NULL,
    duration NUMERIC NOT NULL DEFAULT 0, -- em segundos
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para speed_violations
CREATE INDEX IF NOT EXISTS idx_speed_violations_user_id ON speed_violations(user_id);
CREATE INDEX IF NOT EXISTS idx_speed_violations_vehicle_id ON speed_violations(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_speed_violations_timestamp ON speed_violations(timestamp DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE geofences ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE speed_violations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS DE SEGURANÇA - VEHICLES
-- ============================================
CREATE POLICY "Users can view own vehicles"
    ON vehicles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own vehicles"
    ON vehicles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vehicles"
    ON vehicles FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own vehicles"
    ON vehicles FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- POLÍTICAS DE SEGURANÇA - GEOFENCES
-- ============================================
CREATE POLICY "Users can view own geofences"
    ON geofences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own geofences"
    ON geofences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own geofences"
    ON geofences FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own geofences"
    ON geofences FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- POLÍTICAS DE SEGURANÇA - ALERTS
-- ============================================
CREATE POLICY "Users can view own alerts"
    ON alerts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own alerts"
    ON alerts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts"
    ON alerts FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own alerts"
    ON alerts FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- POLÍTICAS DE SEGURANÇA - TRIPS
-- ============================================
CREATE POLICY "Users can view own trips"
    ON trips FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own trips"
    ON trips FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trips"
    ON trips FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own trips"
    ON trips FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- POLÍTICAS DE SEGURANÇA - SPEED_VIOLATIONS
-- ============================================
CREATE POLICY "Users can view own speed violations"
    ON speed_violations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own speed violations"
    ON speed_violations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own speed violations"
    ON speed_violations FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own speed violations"
    ON speed_violations FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- ============================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para vehicles
CREATE TRIGGER update_vehicles_updated_at
    BEFORE UPDATE ON vehicles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para geofences
CREATE TRIGGER update_geofences_updated_at
    BEFORE UPDATE ON geofences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- HABILITAR REALTIME
-- ============================================
-- Execute estes comandos um por vez no SQL Editor

-- Habilitar realtime para vehicles
ALTER PUBLICATION supabase_realtime ADD TABLE vehicles;

-- Habilitar realtime para alerts
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;

-- Habilitar realtime para geofences
ALTER PUBLICATION supabase_realtime ADD TABLE geofences;

-- ============================================
-- FIM DO SCRIPT
-- ============================================

