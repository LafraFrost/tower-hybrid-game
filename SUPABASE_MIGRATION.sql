-- Supabase Migration: Create game_sessions table

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create game_sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'lobby',
  host_id UUID NOT NULL,
  players JSONB DEFAULT '[]',
  current_floor INTEGER DEFAULT 1,
  node_counter INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_game_sessions_room_code ON game_sessions(room_code);
CREATE INDEX IF NOT EXISTS idx_game_sessions_host_id ON game_sessions(host_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON game_sessions(status);

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_game_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER game_sessions_updated_at
BEFORE UPDATE ON game_sessions
FOR EACH ROW
EXECUTE FUNCTION update_game_sessions_updated_at();

-- Example: Grant permissions to authenticated users (if using Supabase Auth)
-- ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY "Users can view game sessions they are in"
--   ON game_sessions FOR SELECT
--   USING (host_id = auth.uid() OR players::jsonb @> jsonb_build_array(auth.uid()));
-- 
-- CREATE POLICY "Hosts can update their sessions"
--   ON game_sessions FOR UPDATE
--   USING (host_id = auth.uid());
