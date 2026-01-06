import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export type GameSessionRow = {
  id: string;
  room_code: string;
  status: 'lobby' | 'combat' | 'rest' | 'tactical';
  host_id: string;
  players: Array<{
    id: number;
    name: string;
    class: string;
    maxHp: number;
    maxR2: number;
  }>;
  current_floor: number;
  node_counter: number;
  created_at: string;
  updated_at: string;
};

export interface SupabasePresenceUser {
  id: string;
  heroName: string;
  characterClass: string;
  status: string;
}
