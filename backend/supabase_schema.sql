-- SUPABASE DATABASE SCHEMA
-- F1 Strategy Engine Cloud Migration

-- 1. Races Table (Metadata for GP Sessions)
CREATE TABLE IF NOT EXISTS races (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year INTEGER NOT NULL,
    grand_prix TEXT NOT NULL,
    total_laps INTEGER NOT NULL,
    track_image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(year, grand_prix)
);

-- 2. Strategies Table (Saved Optimizations)
CREATE TABLE IF NOT EXISTS strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    race_id UUID REFERENCES races(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    total_time FLOAT NOT NULL,
    pit_stops JSONB NOT NULL, -- [{lap: 18, compound: 'HARD'}, ...]
    mc_results JSONB, -- Monte Carlo stats
    rank INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Telemetry Cache (Processed Scrapes)
-- This allows us to serve 6.5GB worth of data in tiny JSON payloads
CREATE TABLE IF NOT EXISTS telemetry_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    race_id UUID REFERENCES races(id) ON DELETE CASCADE,
    driver_codes TEXT[] NOT NULL,
    session_type TEXT DEFAULT 'R',
    chart_data JSONB NOT NULL, -- Processed points for Recharts
    is_live BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(race_id, session_type)
);

-- ENABLE PUBLIC READ (Since no user accounts requested)
-- Allows frontend to fetch all race data instantly
ALTER TABLE races ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Access" ON races FOR SELECT USING (true);

ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Access" ON strategies FOR SELECT USING (true);

ALTER TABLE telemetry_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Access" ON telemetry_cache FOR SELECT USING (true);
