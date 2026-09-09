-- ==============================================================================
-- MINISTRY OF COAL, GOVERNMENT OF INDIA
-- Smart India Hackathon (SIH) - Mine Subsidence Monitoring Platform
-- Complete PostgreSQL DDL Schema & Demonstrative Seed Script for Supabase
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'ADMIN' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. MINES TABLE
CREATE TABLE IF NOT EXISTS mines (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    organization VARCHAR(255) DEFAULT 'Ministry of Coal, Government of India',
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    boundary_geojson TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. UNDERGROUND PANELS TABLE
CREATE TABLE IF NOT EXISTS panels (
    id VARCHAR(100) PRIMARY KEY,
    mine_id VARCHAR(100) REFERENCES mines(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    extraction_status VARCHAR(50) DEFAULT 'ACTIVE' NOT NULL,
    depth_meters DOUBLE PRECISION DEFAULT 180.0,
    boundary_geojson TEXT,
    risk_level VARCHAR(50) DEFAULT 'NORMAL' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. SENSOR NODES TABLE (Surface Mesh Array)
CREATE TABLE IF NOT EXISTS sensor_nodes (
    id VARCHAR(50) PRIMARY KEY,
    panel_id VARCHAR(100) REFERENCES panels(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    hardware_model VARCHAR(100) DEFAULT 'LoRa-SX1262-Subsidence-V2',
    mesh_parent_id VARCHAR(50) REFERENCES sensor_nodes(id) ON DELETE SET NULL,
    is_gateway BOOLEAN DEFAULT FALSE NOT NULL,
    status VARCHAR(50) DEFAULT 'ONLINE' NOT NULL,
    battery_level DOUBLE PRECISION DEFAULT 95.0,
    signal_strength_rssi INTEGER DEFAULT -68,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. SENSOR READINGS TABLE (High Throughput Telemetry)
CREATE TABLE IF NOT EXISTS sensor_readings (
    id SERIAL PRIMARY KEY,
    node_id VARCHAR(50) REFERENCES sensor_nodes(id) ON DELETE CASCADE NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    tilt_x DOUBLE PRECISION DEFAULT 0.0,
    tilt_y DOUBLE PRECISION DEFAULT 0.0,
    displacement DOUBLE PRECISION DEFAULT 0.0,
    vibration DOUBLE PRECISION DEFAULT 0.0,
    crack_detected BOOLEAN DEFAULT FALSE,
    battery_level DOUBLE PRECISION DEFAULT 100.0,
    signal_strength INTEGER DEFAULT -70,
    anomaly_score DOUBLE PRECISION DEFAULT 0.0,
    is_outlier BOOLEAN DEFAULT FALSE
);

-- 7. RISK ASSESSMENTS TABLE (AI Anomaly Scoring)
CREATE TABLE IF NOT EXISTS risk_assessments (
    id SERIAL PRIMARY KEY,
    panel_id VARCHAR(100) REFERENCES panels(id) ON DELETE CASCADE NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    risk_score DOUBLE PRECISION NOT NULL,
    risk_classification VARCHAR(50) NOT NULL,
    primary_contributing_node_id VARCHAR(50) REFERENCES sensor_nodes(id) ON DELETE SET NULL,
    tilt_factor DOUBLE PRECISION DEFAULT 0.0,
    displacement_factor DOUBLE PRECISION DEFAULT 0.0,
    vibration_factor DOUBLE PRECISION DEFAULT 0.0,
    spatial_correlation_factor DOUBLE PRECISION DEFAULT 0.0,
    explanation TEXT
);

-- 8. ALERTS TABLE
CREATE TABLE IF NOT EXISTS alerts (
    id VARCHAR(100) PRIMARY KEY,
    panel_id VARCHAR(100) REFERENCES panels(id) ON DELETE CASCADE NOT NULL,
    node_cluster VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    condition_detected VARCHAR(255) NOT NULL,
    severity VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE' NOT NULL,
    ai_risk_score DOUBLE PRECISION NOT NULL,
    measured_tilt DOUBLE PRECISION DEFAULT 0.0,
    measured_displacement DOUBLE PRECISION DEFAULT 0.0,
    crack_detected BOOLEAN DEFAULT FALSE,
    recommended_action TEXT DEFAULT 'Immediate field inspection recommended.',
    acknowledged_by VARCHAR(255),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. MESH LINKS TABLE (Wireless DAG Topology)
CREATE TABLE IF NOT EXISTS mesh_links (
    id SERIAL PRIMARY KEY,
    source_node_id VARCHAR(50) REFERENCES sensor_nodes(id) ON DELETE CASCADE NOT NULL,
    target_node_id VARCHAR(50) REFERENCES sensor_nodes(id) ON DELETE CASCADE NOT NULL,
    link_quality_lqi INTEGER DEFAULT 210,
    rssi INTEGER DEFAULT -68,
    hop_count INTEGER DEFAULT 1,
    status VARCHAR(50) DEFAULT 'ACTIVE' NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. SYSTEM LOGS TABLE
CREATE TABLE IF NOT EXISTS system_logs (
    id SERIAL PRIMARY KEY,
    component VARCHAR(100) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- INDEXES FOR HIGH-PERFORMANCE TIME-SERIES QUERIES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_sensor_readings_node_ts ON sensor_readings(node_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_panel_ts ON risk_assessments(panel_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_status_severity ON alerts(status, severity);
CREATE INDEX IF NOT EXISTS idx_sensor_nodes_panel ON sensor_nodes(panel_id);

-- ==============================================================================
-- ENABLE ROW LEVEL SECURITY (RLS) POLICIES FOR SUPABASE DASHBOARD & CLIENT ACCESS
-- ==============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE mines ENABLE ROW LEVEL SECURITY;
ALTER TABLE panels ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mesh_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Public read access for mines" ON mines;
    CREATE POLICY "Public read access for mines" ON mines FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Public read access for panels" ON panels;
    CREATE POLICY "Public read access for panels" ON panels FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public read access for sensor_nodes" ON sensor_nodes;
    CREATE POLICY "Public read access for sensor_nodes" ON sensor_nodes FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public read access for sensor_readings" ON sensor_readings;
    CREATE POLICY "Public read access for sensor_readings" ON sensor_readings FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public read access for risk_assessments" ON risk_assessments;
    CREATE POLICY "Public read access for risk_assessments" ON risk_assessments FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public read access for alerts" ON alerts;
    CREATE POLICY "Public read access for alerts" ON alerts FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public read access for mesh_links" ON mesh_links;
    CREATE POLICY "Public read access for mesh_links" ON mesh_links FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS "Public read access for users" ON users;
    CREATE POLICY "Public read access for users" ON users FOR SELECT USING (true);
END $$;

-- ==============================================================================
-- SEED DATA (Ministry of Coal Demonstration - Korba Underground Coalfield Block-A)
-- ==============================================================================

-- Admin User (Password: Admin@Coal2026)
INSERT INTO users (id, email, hashed_password, full_name, role)
VALUES (
    1,
    'admin@coal.gov.in',
    'b0bc7cf22805e1924577d748cfb3832d$bea54858a3f416dfd0193a722c0a94f9fc056e7f4cf97b55dc778d0474eee3aa',
    'Mine Safety Officer (SECL)',
    'ADMIN'
) ON CONFLICT (email) DO NOTHING;

-- Mine
INSERT INTO mines (id, name, organization, latitude, longitude, boundary_geojson)
VALUES (
    'MINE-SECL-KORBA',
    'Korba Underground Coal Mine (Block-A)',
    'Ministry of Coal / South Eastern Coalfields Limited',
    22.3595,
    82.7501,
    '{"type": "Polygon", "coordinates": [[[82.7420, 22.3520], [82.7600, 22.3520], [82.7620, 22.3680], [82.7400, 22.3680], [82.7420, 22.3520]]]}'
) ON CONFLICT (id) DO NOTHING;

-- 5 Underground Panels
INSERT INTO panels (id, mine_id, name, extraction_status, depth_meters, risk_level, boundary_geojson)
VALUES 
('PANEL-A1', 'MINE-SECL-KORBA', 'Panel A1 (Sealed Gaf)', 'INACTIVE', 160.0, 'NORMAL', '{"type": "Polygon", "coordinates": [[[82.7430, 22.3540], [82.7490, 22.3540], [82.7490, 22.3590], [82.7430, 22.3590], [82.7430, 22.3540]]]}'),
('PANEL-A2', 'MINE-SECL-KORBA', 'Panel A2 (Post-Depillared)', 'INACTIVE', 175.0, 'NORMAL', '{"type": "Polygon", "coordinates": [[[82.7500, 22.3540], [82.7560, 22.3540], [82.7560, 22.3590], [82.7500, 22.3590], [82.7500, 22.3540]]]}'),
('PANEL-B1', 'MINE-SECL-KORBA', 'Panel B1 (Continuous Miner)', 'ACTIVE', 190.0, 'NORMAL', '{"type": "Polygon", "coordinates": [[[82.7430, 22.3600], [82.7490, 22.3600], [82.7490, 22.3650], [82.7430, 22.3650], [82.7430, 22.3600]]]}'),
('PANEL-B2', 'MINE-SECL-KORBA', 'Panel B2 (Development Section)', 'ACTIVE', 185.0, 'NORMAL', '{"type": "Polygon", "coordinates": [[[82.7500, 22.3600], [82.7560, 22.3600], [82.7560, 22.3650], [82.7500, 22.3650], [82.7500, 22.3600]]]}'),
('PANEL-B3', 'MINE-SECL-KORBA', 'Panel B3 (Active Depillaring - Core)', 'ACTIVE', 210.0, 'NORMAL', '{"type": "Polygon", "coordinates": [[[82.7530, 22.3610], [82.7600, 22.3610], [82.7600, 22.3670], [82.7530, 22.3670], [82.7530, 22.3610]]]}')
ON CONFLICT (id) DO NOTHING;

-- 24 Surface Sensor Nodes
INSERT INTO sensor_nodes (id, panel_id, name, latitude, longitude, hardware_model, mesh_parent_id, is_gateway, status, battery_level, signal_strength_rssi)
VALUES
('N01', 'PANEL-B1', 'Surface Node N01 (LoRa Gateway Hub)', 22.3600, 82.7490, 'LoRa-Gateway-Hub', NULL, TRUE, 'ONLINE', 99.0, -62),
('N02', 'PANEL-A1', 'Surface Node N02', 22.3550, 82.7450, 'LoRa-SX1262-Subsidence-V2', 'N01', FALSE, 'ONLINE', 96.0, -68),
('N03', 'PANEL-A1', 'Surface Node N03', 22.3575, 82.7470, 'LoRa-SX1262-Subsidence-V2', 'N02', FALSE, 'ONLINE', 94.5, -72),
('N04', 'PANEL-A2', 'Surface Node N04', 22.3555, 82.7525, 'LoRa-SX1262-Subsidence-V2', 'N01', FALSE, 'ONLINE', 97.0, -66),
('N05', 'PANEL-A2', 'Surface Node N05', 22.3580, 82.7545, 'LoRa-SX1262-Subsidence-V2', 'N04', FALSE, 'ONLINE', 93.0, -74),
('N06', 'PANEL-B1', 'Surface Node N06', 22.3615, 82.7450, 'LoRa-SX1262-Subsidence-V2', 'N01', FALSE, 'ONLINE', 95.5, -67),
('N07', 'PANEL-B1', 'Surface Node N07', 22.3635, 82.7470, 'LoRa-SX1262-Subsidence-V2', 'N06', FALSE, 'ONLINE', 96.0, -71),
('N08', 'PANEL-B1', 'Surface Node N08', 22.3640, 82.7445, 'LoRa-SX1262-Subsidence-V2', 'N07', FALSE, 'ONLINE', 92.5, -76),
('N09', 'PANEL-B2', 'Surface Node N09', 22.3610, 82.7515, 'LoRa-SX1262-Subsidence-V2', 'N01', FALSE, 'ONLINE', 98.0, -65),
('N10', 'PANEL-B2', 'Surface Node N10', 22.3630, 82.7535, 'LoRa-SX1262-Subsidence-V2', 'N09', FALSE, 'ONLINE', 94.0, -69),
('N11', 'PANEL-B2', 'Surface Node N11', 22.3645, 82.7520, 'LoRa-SX1262-Subsidence-V2', 'N10', FALSE, 'ONLINE', 93.5, -73),
('N12', 'PANEL-B3', 'Surface Node N12', 22.3625, 82.7555, 'LoRa-SX1262-Subsidence-V2', 'N10', FALSE, 'ONLINE', 96.5, -70),
('N13', 'PANEL-B3', 'Surface Node N13', 22.3635, 82.7570, 'LoRa-SX1262-Subsidence-V2', 'N12', FALSE, 'ONLINE', 95.0, -68),
('N14', 'PANEL-B3', 'Surface Node N14', 22.3645, 82.7580, 'LoRa-SX1262-Subsidence-V2', 'N13', FALSE, 'ONLINE', 97.5, -67),
('N15', 'PANEL-B3', 'Surface Node N15', 22.3655, 82.7565, 'LoRa-SX1262-Subsidence-V2', 'N14', FALSE, 'ONLINE', 94.0, -72),
('N16', 'PANEL-B3', 'Surface Node N16', 22.3660, 82.7585, 'LoRa-SX1262-Subsidence-V2', 'N15', FALSE, 'ONLINE', 93.0, -75),
('N17', 'PANEL-B3', 'Surface Node N17', 22.3620, 82.7580, 'LoRa-SX1262-Subsidence-V2', 'N12', FALSE, 'ONLINE', 96.0, -69),
('N18', 'PANEL-B3', 'Surface Node N18', 22.3638, 82.7595, 'LoRa-SX1262-Subsidence-V2', 'N17', FALSE, 'ONLINE', 95.5, -71),
('N19', 'PANEL-B3', 'Surface Node N19', 22.3670, 82.7550, 'LoRa-SX1262-Subsidence-V2', 'N15', FALSE, 'ONLINE', 92.0, -78),
('N20', 'PANEL-B2', 'Surface Node N20', 22.3665, 82.7505, 'LoRa-SX1262-Subsidence-V2', 'N11', FALSE, 'ONLINE', 94.0, -74),
('N21', 'PANEL-A1', 'Surface Node N21', 22.3530, 82.7485, 'LoRa-SX1262-Subsidence-V2', 'N03', FALSE, 'ONLINE', 93.5, -75),
('N22', 'PANEL-A2', 'Surface Node N22', 22.3535, 82.7555, 'LoRa-SX1262-Subsidence-V2', 'N04', FALSE, 'ONLINE', 95.0, -73),
('N23', 'PANEL-B1', 'Surface Node N23', 22.3590, 82.7430, 'LoRa-SX1262-Subsidence-V2', 'N06', FALSE, 'ONLINE', 96.0, -70),
('N24', 'PANEL-B3', 'Surface Node N24', 22.3665, 82.7600, 'LoRa-SX1262-Subsidence-V2', 'N16', FALSE, 'ONLINE', 91.5, -79)
ON CONFLICT (id) DO NOTHING;

-- Mesh Topology Links
INSERT INTO mesh_links (source_node_id, target_node_id, link_quality_lqi, rssi, hop_count, status)
VALUES
('N02', 'N01', 240, -68, 1, 'ACTIVE'),
('N03', 'N02', 230, -72, 2, 'ACTIVE'),
('N04', 'N01', 245, -66, 1, 'ACTIVE'),
('N05', 'N04', 220, -74, 2, 'ACTIVE'),
('N06', 'N01', 242, -67, 1, 'ACTIVE'),
('N07', 'N06', 225, -71, 2, 'ACTIVE'),
('N08', 'N07', 215, -76, 3, 'ACTIVE'),
('N09', 'N01', 248, -65, 1, 'ACTIVE'),
('N10', 'N09', 235, -69, 2, 'ACTIVE'),
('N11', 'N10', 220, -73, 3, 'ACTIVE'),
('N12', 'N10', 230, -70, 3, 'ACTIVE'),
('N13', 'N12', 238, -68, 4, 'ACTIVE'),
('N14', 'N13', 240, -67, 5, 'ACTIVE'),
('N15', 'N14', 225, -72, 6, 'ACTIVE'),
('N16', 'N15', 218, -75, 7, 'ACTIVE'),
('N17', 'N12', 232, -69, 4, 'ACTIVE'),
('N18', 'N17', 228, -71, 5, 'ACTIVE'),
('N19', 'N15', 210, -78, 7, 'ACTIVE'),
('N20', 'N11', 222, -74, 4, 'ACTIVE'),
('N21', 'N03', 216, -75, 3, 'ACTIVE'),
('N22', 'N04', 224, -73, 2, 'ACTIVE'),
('N23', 'N06', 235, -70, 2, 'ACTIVE'),
('N24', 'N16', 205, -79, 8, 'ACTIVE');

-- Baseline Readings (Past 2 hours)
INSERT INTO sensor_readings (node_id, timestamp, tilt_x, tilt_y, displacement, vibration, crack_detected, battery_level, signal_strength, anomaly_score, is_outlier)
SELECT 
    id,
    now() - interval '1 hour',
    0.12,
    -0.08,
    1.2,
    0.35,
    FALSE,
    battery_level,
    signal_strength_rssi,
    0.04,
    FALSE
FROM sensor_nodes;

INSERT INTO sensor_readings (node_id, timestamp, tilt_x, tilt_y, displacement, vibration, crack_detected, battery_level, signal_strength, anomaly_score, is_outlier)
SELECT 
    id,
    now(),
    0.15,
    -0.05,
    1.4,
    0.42,
    FALSE,
    battery_level,
    signal_strength_rssi,
    0.05,
    FALSE
FROM sensor_nodes;

-- Baseline Risk Assessment for Panel B3
INSERT INTO risk_assessments (panel_id, timestamp, risk_score, risk_classification, primary_contributing_node_id, tilt_factor, displacement_factor, vibration_factor, spatial_correlation_factor, explanation)
VALUES (
    'PANEL-B3',
    now(),
    13.5,
    'NORMAL',
    'N14',
    22.0,
    38.0,
    20.0,
    20.0,
    'Ground movements within baseline geotechnical equilibrium tolerance.'
);

-- ==============================================================================
-- END OF SUPABASE SQL SETUP SCRIPT
-- ==============================================================================
