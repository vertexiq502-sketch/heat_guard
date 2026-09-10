-- Clean up existing tables to avoid conflicts
DROP TABLE IF EXISTS threshold_configurations CASCADE;
DROP TABLE IF EXISTS compliance_logs CASCADE;
DROP TABLE IF EXISTS escalation_events CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS risk_assessments CASCADE;
DROP TABLE IF EXISTS weather_readings CASCADE;
DROP TABLE IF EXISTS worker_assignments CASCADE;
DROP TABLE IF EXISTS sites CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE,
    phone TEXT UNIQUE,
    password_hash TEXT,
    role TEXT CHECK (role IN ('worker', 'supervisor', 'authority')),
    language TEXT CHECK (language IN ('en', 'te', 'hi')),
    name TEXT,
    worker_type TEXT CHECK (worker_type IN ('construction', 'delivery', 'farm')),
    intensity TEXT CHECK (intensity IN ('light', 'moderate', 'heavy')),
    exposure TEXT CHECK (exposure IN ('fullSun', 'partialShade', 'shade')),
    duration TEXT CHECK (duration IN ('short', 'moderate', 'prolonged')),
    clothing TEXT CHECK (clothing IN ('normal', 'moderatePPE', 'heavyPPE')),
    last_location JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create Sites Table
CREATE TABLE IF NOT EXISTS sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    location GEOGRAPHY(POINT),
    address TEXT,
    district TEXT,
    site_type TEXT CHECK (site_type IN ('construction', 'farm', 'delivery')),
    default_exposure TEXT CHECK (default_exposure IN ('fullSun', 'partialShade', 'shade')),
    risk_level TEXT CHECK (risk_level IN ('green', 'yellow', 'orange', 'red')),
    last_risk_update TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create Worker Assignments Table
CREATE TABLE IF NOT EXISTS worker_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID REFERENCES users(id) ON DELETE CASCADE,
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
    start_date DATE,
    end_date DATE,
    custom_intensity TEXT CHECK (custom_intensity IN ('light', 'moderate', 'heavy')),
    custom_exposure TEXT CHECK (custom_exposure IN ('fullSun', 'partialShade', 'shade')),
    custom_duration TEXT CHECK (custom_duration IN ('short', 'moderate', 'prolonged')),
    custom_clothing TEXT CHECK (custom_clothing IN ('normal', 'moderatePPE', 'heavyPPE')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Weather Readings Table
CREATE TABLE IF NOT EXISTS weather_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
    temperature FLOAT,
    humidity FLOAT,
    uv_index FLOAT,
    wind_speed FLOAT,
    pressure FLOAT,
    condition TEXT,
    source TEXT CHECK (source IN ('open-meteo', 'cache', 'simulated')),
    station_distance FLOAT,
    confidence TEXT CHECK (confidence IN ('high', 'medium', 'low')),
    timestamp TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
);

-- Create Risk Assessments Table
CREATE TABLE IF NOT EXISTS risk_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID REFERENCES users(id) ON DELETE CASCADE,
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
    weather_reading_id UUID REFERENCES weather_readings(id) ON DELETE SET NULL,
    effective_temp FLOAT,
    risk_level TEXT CHECK (risk_level IN ('green', 'yellow', 'orange', 'red')),
    risk_score FLOAT,
    confidence TEXT CHECK (confidence IN ('high', 'medium', 'low')),
    explanation TEXT,
    recommendation JSONB,
    timestamp TIMESTAMPTZ DEFAULT now()
);

-- Create Alerts Table
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID REFERENCES users(id) ON DELETE CASCADE,
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
    risk_assessment_id UUID REFERENCES risk_assessments(id) ON DELETE SET NULL,
    type TEXT CHECK (type IN ('risk_update', 'caution', 'high_risk', 'danger', 'escalation')),
    severity TEXT CHECK (severity IN ('info', 'warning', 'critical')),
    title TEXT,
    message TEXT,
    title_te TEXT,
    message_te TEXT,
    title_hi TEXT,
    message_hi TEXT,
    status TEXT CHECK (status IN ('pending', 'sent', 'acknowledged', 'actioned')),
    sent_at TIMESTAMPTZ,
    acknowledged_at TIMESTAMPTZ,
    actioned_at TIMESTAMPTZ,
    acknowledgement_note TEXT,
    delivery_channel TEXT CHECK (delivery_channel IN ('in_app', 'push', 'sms', 'email')),
    escalation_level INTEGER CHECK (escalation_level IN (0, 1, 2, 3)),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Escalation Events Table
CREATE TABLE IF NOT EXISTS escalation_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID REFERENCES alerts(id) ON DELETE CASCADE,
    worker_id UUID REFERENCES users(id) ON DELETE CASCADE,
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
    level INTEGER CHECK (level IN (1, 2, 3)),
    triggered_by TEXT CHECK (triggered_by IN ('timeout', 'manual', 'auto')),
    timeout_duration INTEGER,
    reason TEXT,
    notification_sent BOOLEAN DEFAULT false,
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_at TIMESTAMPTZ,
    response_action TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Compliance Logs Table
CREATE TABLE IF NOT EXISTS compliance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
    worker_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_type TEXT CHECK (event_type IN ('risk_breach', 'alert_sent', 'acknowledged', 'action_taken', 'escalation')),
    risk_level TEXT CHECK (risk_level IN ('green', 'yellow', 'orange', 'red')),
    details JSONB,
    event_time TIMESTAMPTZ,
    recorded_at TIMESTAMPTZ DEFAULT now()
);

-- Create Threshold Configurations Table
CREATE TABLE IF NOT EXISTS threshold_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key TEXT UNIQUE,
    thresholds JSONB,
    source TEXT,
    validation_status TEXT CHECK (validation_status IN ('draft', 'validated')),
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE INDEX IF NOT EXISTS idx_sites_location ON sites USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_sites_district ON sites(district);

CREATE INDEX IF NOT EXISTS idx_worker_assignments_worker ON worker_assignments(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_assignments_site ON worker_assignments(site_id);
CREATE INDEX IF NOT EXISTS idx_worker_assignments_active ON worker_assignments(is_active);

CREATE INDEX IF NOT EXISTS idx_weather_readings_site ON weather_readings(site_id);
CREATE INDEX IF NOT EXISTS idx_weather_readings_timestamp ON weather_readings(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_weather_readings_expires ON weather_readings(expires_at);

CREATE INDEX IF NOT EXISTS idx_risk_assessments_worker_time ON risk_assessments(worker_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_site_time ON risk_assessments(site_id, timestamp);

CREATE INDEX IF NOT EXISTS idx_alerts_worker_status ON alerts(worker_id, status);
CREATE INDEX IF NOT EXISTS idx_alerts_site_severity ON alerts(site_id, severity);
CREATE INDEX IF NOT EXISTS idx_alerts_sent_at ON alerts(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_expires ON alerts(expires_at);

CREATE INDEX IF NOT EXISTS idx_escalation_events_alert ON escalation_events(alert_id);
CREATE INDEX IF NOT EXISTS idx_escalation_events_site_level ON escalation_events(site_id, level);
CREATE INDEX IF NOT EXISTS idx_escalation_events_created ON escalation_events(created_at);

CREATE INDEX IF NOT EXISTS idx_compliance_logs_site_time ON compliance_logs(site_id, event_time);
CREATE INDEX IF NOT EXISTS idx_compliance_logs_worker_time ON compliance_logs(worker_id, event_time);

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE threshold_configurations ENABLE ROW LEVEL SECURITY;

-- users table policies
DROP POLICY IF EXISTS "Users can read their own profile" ON users;
CREATE POLICY "Users can read their own profile" ON users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON users;
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
CREATE POLICY "Users can insert their own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- sites table policies
DROP POLICY IF EXISTS "Authority can see all sites" ON sites;
CREATE POLICY "Authority can see all sites" ON sites FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'authority')
);

DROP POLICY IF EXISTS "Workers and Supervisors can see assigned sites" ON sites;
CREATE POLICY "Workers and Supervisors can see assigned sites" ON sites FOR SELECT USING (
  id IN (SELECT site_id FROM worker_assignments WHERE worker_id = auth.uid())
);

DROP POLICY IF EXISTS "Authority can update all sites" ON sites;
CREATE POLICY "Authority can update all sites" ON sites FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'authority')
);

DROP POLICY IF EXISTS "Supervisors can update assigned sites" ON sites;
CREATE POLICY "Supervisors can update assigned sites" ON sites FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'supervisor') AND
  id IN (SELECT site_id FROM worker_assignments WHERE worker_id = auth.uid())
);

DROP POLICY IF EXISTS "Authority can insert sites" ON sites;
CREATE POLICY "Authority can insert sites" ON sites FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'authority')
);

-- worker_assignments table policies
DROP POLICY IF EXISTS "Authority can see all assignments" ON worker_assignments;
CREATE POLICY "Authority can see all assignments" ON worker_assignments FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'authority')
);

DROP POLICY IF EXISTS "Workers can see own assignments" ON worker_assignments;
CREATE POLICY "Workers can see own assignments" ON worker_assignments FOR SELECT USING (
  worker_id = auth.uid()
);

DROP POLICY IF EXISTS "Supervisors can see assignments for their sites" ON worker_assignments;
CREATE POLICY "Supervisors can see assignments for their sites" ON worker_assignments FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'supervisor') AND
  site_id IN (SELECT site_id FROM worker_assignments WHERE worker_id = auth.uid())
);

DROP POLICY IF EXISTS "Authority can update all assignments" ON worker_assignments;
CREATE POLICY "Authority can update all assignments" ON worker_assignments FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'authority')
);

DROP POLICY IF EXISTS "Supervisors can update assignments for their sites" ON worker_assignments;
CREATE POLICY "Supervisors can update assignments for their sites" ON worker_assignments FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'supervisor') AND
  site_id IN (SELECT site_id FROM worker_assignments WHERE worker_id = auth.uid())
);

DROP POLICY IF EXISTS "Authority can insert assignments" ON worker_assignments;
CREATE POLICY "Authority can insert assignments" ON worker_assignments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'authority')
);

DROP POLICY IF EXISTS "Supervisors can insert assignments for their sites" ON worker_assignments;
CREATE POLICY "Supervisors can insert assignments for their sites" ON worker_assignments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'supervisor') AND
  site_id IN (SELECT site_id FROM worker_assignments WHERE worker_id = auth.uid())
);

-- weather_readings table policies
DROP POLICY IF EXISTS "All authenticated users can view weather readings" ON weather_readings;
CREATE POLICY "All authenticated users can view weather readings" ON weather_readings FOR SELECT USING (
  auth.uid() IS NOT NULL
);

-- risk_assessments table policies
DROP POLICY IF EXISTS "Authority can see all risk assessments" ON risk_assessments;
CREATE POLICY "Authority can see all risk assessments" ON risk_assessments FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'authority')
);

DROP POLICY IF EXISTS "Workers can see their own risk assessments" ON risk_assessments;
CREATE POLICY "Workers can see their own risk assessments" ON risk_assessments FOR SELECT USING (
  worker_id = auth.uid()
);

DROP POLICY IF EXISTS "Supervisors can see risk assessments for workers on their sites" ON risk_assessments;
CREATE POLICY "Supervisors can see risk assessments for workers on their sites" ON risk_assessments FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'supervisor') AND
  site_id IN (SELECT site_id FROM worker_assignments WHERE worker_id = auth.uid())
);

-- alerts table policies
DROP POLICY IF EXISTS "Authority can see all alerts" ON alerts;
CREATE POLICY "Authority can see all alerts" ON alerts FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'authority')
);

DROP POLICY IF EXISTS "Workers can see their own alerts" ON alerts;
CREATE POLICY "Workers can see their own alerts" ON alerts FOR SELECT USING (
  worker_id = auth.uid()
);

DROP POLICY IF EXISTS "Supervisors can see alerts for workers on their sites" ON alerts;
CREATE POLICY "Supervisors can see alerts for workers on their sites" ON alerts FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'supervisor') AND
  site_id IN (SELECT site_id FROM worker_assignments WHERE worker_id = auth.uid())
);

DROP POLICY IF EXISTS "Authority can update all alerts" ON alerts;
CREATE POLICY "Authority can update all alerts" ON alerts FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'authority')
);

DROP POLICY IF EXISTS "Recipient can acknowledge their alerts" ON alerts;
CREATE POLICY "Recipient can acknowledge their alerts" ON alerts FOR UPDATE USING (
  worker_id = auth.uid()
);

-- escalation_events table policies
DROP POLICY IF EXISTS "Authority can see all escalations" ON escalation_events;
CREATE POLICY "Authority can see all escalations" ON escalation_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'authority')
);

DROP POLICY IF EXISTS "Supervisors can see escalations for their sites" ON escalation_events;
CREATE POLICY "Supervisors can see escalations for their sites" ON escalation_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'supervisor') AND
  site_id IN (SELECT site_id FROM worker_assignments WHERE worker_id = auth.uid())
);

DROP POLICY IF EXISTS "Authority can update escalations" ON escalation_events;
CREATE POLICY "Authority can update escalations" ON escalation_events FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'authority')
);

-- compliance_logs table policies
DROP POLICY IF EXISTS "Authority can see all logs" ON compliance_logs;
CREATE POLICY "Authority can see all logs" ON compliance_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'authority')
);

DROP POLICY IF EXISTS "Supervisors can see logs for their sites" ON compliance_logs;
CREATE POLICY "Supervisors can see logs for their sites" ON compliance_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'supervisor') AND
  site_id IN (SELECT site_id FROM worker_assignments WHERE worker_id = auth.uid())
);

-- threshold_configurations table policies
DROP POLICY IF EXISTS "All authenticated users can view thresholds" ON threshold_configurations;
CREATE POLICY "All authenticated users can view thresholds" ON threshold_configurations FOR SELECT USING (
  auth.uid() IS NOT NULL
);

DROP POLICY IF EXISTS "Authority can update thresholds" ON threshold_configurations;
CREATE POLICY "Authority can update thresholds" ON threshold_configurations FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'authority')
);

DROP POLICY IF EXISTS "Authority can insert thresholds" ON threshold_configurations;
CREATE POLICY "Authority can insert thresholds" ON threshold_configurations FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'authority')
);
