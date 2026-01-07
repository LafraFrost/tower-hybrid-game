-- Add solo_progress JSONB and ensure persistent fields exist on user_profiles
ALTER TABLE IF EXISTS user_profiles
  ADD COLUMN IF NOT EXISTS solo_progress JSONB DEFAULT '{}'::jsonb;

-- Ensure persistent_credits and persistent_deck_cards exist
ALTER TABLE IF EXISTS user_profiles
  ADD COLUMN IF NOT EXISTS persistent_credits INTEGER DEFAULT 100;

ALTER TABLE IF EXISTS user_profiles
  ADD COLUMN IF NOT EXISTS persistent_deck_cards JSONB DEFAULT '[]'::jsonb;

-- ============================================
-- SUPABASE TABLE MIGRATIONS
-- ============================================
-- Esegui questi comandi nel Supabase SQL Editor
-- https://supabase.com/dashboard -> SQL Editor

-- 1. GPS LOCATIONS TABLE
CREATE TABLE IF NOT EXISTS gps_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(10, 2),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_gps_locations_user_id ON gps_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_gps_locations_timestamp ON gps_locations(timestamp DESC);

-- Enable RLS for gps_locations
ALTER TABLE gps_locations ENABLE ROW LEVEL SECURITY;

-- Users can view their own GPS locations
CREATE POLICY "Users can view own GPS locations" ON gps_locations
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own GPS locations
CREATE POLICY "Users can insert own GPS locations" ON gps_locations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all GPS locations
CREATE POLICY "Admins can view all GPS locations" ON gps_locations
  FOR SELECT USING (
    auth.email() = 'lafranconi.andrea96@gmail.com'
  );

-- ============================================

-- 2. USER PERMISSIONS TABLE
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  permissions_granted BOOLEAN DEFAULT FALSE,
  location_permission BOOLEAN DEFAULT FALSE,
  camera_permission BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for user_id
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);

-- Enable RLS for user_permissions
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- Users can view and update their own permissions
CREATE POLICY "Users can view own permissions" ON user_permissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own permissions" ON user_permissions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own permissions" ON user_permissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================

-- 3. EVENTS TABLE (for goblin attacks, etc)
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(50) NOT NULL, -- 'goblin_attack', 'boss_event', etc
  is_active BOOLEAN DEFAULT FALSE,
  data JSONB, -- Extra data for the event (location, difficulty, etc)
  triggered_by_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for is_active and event_type
CREATE INDEX IF NOT EXISTS idx_events_active ON events(is_active);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);

-- Enable RLS for events
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view events
CREATE POLICY "Authenticated users can view events" ON events
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only admin can insert/update events
CREATE POLICY "Admin can create events" ON events
  FOR INSERT WITH CHECK (
    auth.email() = 'lafranconi.andrea96@gmail.com'
  );

CREATE POLICY "Admin can update events" ON events
  FOR UPDATE USING (
    auth.email() = 'lafranconi.andrea96@gmail.com'
  );

-- ============================================

-- 4. REALTIME SUBSCRIPTIONS
-- Enable realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE gps_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE events;
ALTER PUBLICATION supabase_realtime ADD TABLE user_permissions;

-- ============================================
-- END OF MIGRATIONS
-- ============================================
