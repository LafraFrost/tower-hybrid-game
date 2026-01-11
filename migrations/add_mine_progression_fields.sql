-- Migration: Add Mine progression fields to game_locations
-- Date: 2026-01-11
-- Description: Adds is_unlocked, is_under_attack, and mine_map_completed fields
-- to support 4-state Mine progression system

-- Add new columns to game_locations table
ALTER TABLE game_locations 
ADD COLUMN IF NOT EXISTS is_unlocked BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_under_attack BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS mine_map_completed BOOLEAN DEFAULT false;

-- Update existing Miniera records to have is_unlocked = false (will be unlocked after Goblin victory)
UPDATE game_locations 
SET is_unlocked = false 
WHERE name = 'Miniera' AND is_unlocked IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN game_locations.is_unlocked IS 'Mine becomes visible after Goblin mini-combat victory';
COMMENT ON COLUMN game_locations.mine_map_completed IS 'Set to true after player completes map node 22 (Mine Boss)';
COMMENT ON COLUMN game_locations.is_under_attack IS 'Building under Goblin attack (for future defense events)';

-- Verify changes
SELECT id, name, is_unlocked, mine_map_completed, is_built 
FROM game_locations 
WHERE name = 'Miniera';
