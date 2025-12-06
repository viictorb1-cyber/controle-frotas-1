-- ============================================
-- Schema SEM Autenticação - Controle de Frotas
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- Primeiro, dropar as tabelas existentes (CUIDADO: isso apaga todos os dados!)
DROP TABLE IF EXISTS speed_violations CASCADE;
DROP TABLE IF EXISTS trips CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS geofences CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;

-- Habilitar extensão UUID se não existir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABELA: vehicles (Veículos)
-- ============================================
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_last_update ON vehicles(last_update);

-- ============================================
-- TABELA: geofences (Cercas Geográficas)
-- ============================================
CREATE TABLE geofences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('circle', 'polygon')),
    active BOOLEAN NOT NULL DEFAULT true,
    center JSONB,
    radius NUMERIC,
    points JSONB,
    rules JSONB NOT NULL DEFAULT '[]'::jsonb,
    vehicle_ids TEXT[] NOT NULL DEFAULT '{}',
    last_triggered TIMESTAMPTZ,
    color TEXT DEFAULT '#3b82f6',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para geofences
CREATE INDEX idx_geofences_active ON geofences(active);

-- ============================================
-- TABELA: alerts (Alertas)
-- ============================================
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
CREATE INDEX idx_alerts_timestamp ON alerts(timestamp DESC);
CREATE INDEX idx_alerts_read ON alerts(read);
CREATE INDEX idx_alerts_type ON alerts(type);

-- ============================================
-- TABELA: trips (Viagens)
-- ============================================
CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    total_distance NUMERIC NOT NULL DEFAULT 0,
    travel_time NUMERIC NOT NULL DEFAULT 0,
    stopped_time NUMERIC NOT NULL DEFAULT 0,
    average_speed NUMERIC NOT NULL DEFAULT 0,
    max_speed NUMERIC NOT NULL DEFAULT 0,
    stops_count INTEGER NOT NULL DEFAULT 0,
    points JSONB NOT NULL DEFAULT '[]'::jsonb,
    events JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para trips
CREATE INDEX idx_trips_vehicle_id ON trips(vehicle_id);
CREATE INDEX idx_trips_start_time ON trips(start_time);

-- ============================================
-- TABELA: speed_violations (Violações de Velocidade)
-- ============================================
CREATE TABLE speed_violations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    vehicle_name TEXT NOT NULL,
    speed NUMERIC NOT NULL,
    speed_limit NUMERIC NOT NULL,
    excess_speed NUMERIC NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    latitude NUMERIC NOT NULL,
    longitude NUMERIC NOT NULL,
    duration NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para speed_violations
CREATE INDEX idx_speed_violations_vehicle_id ON speed_violations(vehicle_id);
CREATE INDEX idx_speed_violations_timestamp ON speed_violations(timestamp DESC);

-- ============================================
-- DESABILITAR RLS (Row Level Security)
-- ============================================
ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE geofences DISABLE ROW LEVEL SECURITY;
ALTER TABLE alerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE speed_violations DISABLE ROW LEVEL SECURITY;

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
DROP TRIGGER IF EXISTS update_vehicles_updated_at ON vehicles;
CREATE TRIGGER update_vehicles_updated_at
    BEFORE UPDATE ON vehicles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para geofences
DROP TRIGGER IF EXISTS update_geofences_updated_at ON geofences;
CREATE TRIGGER update_geofences_updated_at
    BEFORE UPDATE ON geofences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- HABILITAR REALTIME (opcional)
-- ============================================
-- Execute separadamente se quiser atualizações em tempo real:
-- ALTER PUBLICATION supabase_realtime ADD TABLE vehicles;
-- ALTER PUBLICATION supabase_realtime ADD TABLE alerts;
-- ALTER PUBLICATION supabase_realtime ADD TABLE geofences;

-- ============================================
-- INSERIR DADOS DE EXEMPLO
-- ============================================
INSERT INTO vehicles (name, license_plate, model, status, ignition, current_speed, speed_limit, heading, latitude, longitude, accuracy, battery_level) VALUES
('Caminhão 01', 'ABC-1234', 'Mercedes Actros', 'moving', 'on', 72, 80, 45, -23.5489, -46.6388, 5, 85),
('Van 02', 'DEF-5678', 'Fiat Ducato', 'moving', 'on', 55, 60, 180, -23.5605, -46.6533, 3, 92),
('Caminhão 03', 'GHI-9012', 'Volvo FH', 'stopped', 'off', 0, 80, 0, -23.5305, -46.6233, 4, 78),
('Van 04', 'JKL-3456', 'Renault Master', 'moving', 'on', 48, 60, 270, -23.5705, -46.6433, 6, 67),
('Caminhão 05', 'MNO-7890', 'Scania R450', 'idle', 'on', 0, 80, 90, -23.5405, -46.6133, 4, 91),
('Van 06', 'PQR-1234', 'VW Delivery', 'offline', 'off', 0, 60, 0, -23.5205, -46.6733, 10, 45);

INSERT INTO geofences (name, description, type, active, center, radius, rules, vehicle_ids, color) VALUES
('Depósito Central', 'Área principal de carga e descarga', 'circle', true, '{"latitude": -23.5505, "longitude": -46.6333}', 500, '[{"type": "entry", "enabled": true}, {"type": "exit", "enabled": true}]', '{}', '#22c55e'),
('Área Restrita', 'Zona de acesso proibido', 'circle', true, '{"latitude": -23.5800, "longitude": -46.6600}', 300, '[{"type": "entry", "enabled": true}]', '{}', '#ef4444');

INSERT INTO alerts (type, priority, vehicle_id, vehicle_name, message, read) VALUES
('speed', 'warning', 'v1', 'Van 02', 'Velocidade próxima ao limite', false),
('system', 'info', 'v6', 'Van 06', 'Veículo offline há mais de 1 hora', false);

-- ============================================
-- FIM DO SCRIPT
-- ============================================
