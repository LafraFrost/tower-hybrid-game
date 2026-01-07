import { supabase } from './supabaseClient';

export type SoloProgress = {
  currentNode: number;
  visited: number[];
  logs: string[];
  bossDefeated: boolean;
};

const TABLE = 'user_profiles';

export async function loadSoloProgress(heroName: string): Promise<SoloProgress | null> {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('hero_name, hero_class, persistent_credits, persistent_deck_cards, solo_progress')
      .eq('hero_name', heroName)
      .maybeSingle();

    if (error) {
      console.warn('Supabase loadSoloProgress error:', error);
      return null;
    }

    const progress = (data as any)?.solo_progress as SoloProgress | undefined;
    if (progress && typeof progress.currentNode === 'number') {
      return progress;
    }
  } catch (e) {
    console.warn('loadSoloProgress exception:', e);
  }
  return null;
}

export async function saveSoloProgress(heroName: string, heroClass: string, progress: SoloProgress) {
  try {
    const payload = {
      hero_name: heroName,
      hero_class: heroClass || 'Unknown',
      solo_progress: progress,
      updated_at: new Date().toISOString(),
    } as any;

    const { error } = await supabase
      .from(TABLE)
      .upsert(payload, { onConflict: 'hero_name' });

    if (error) {
      console.warn('Supabase saveSoloProgress error:', error);
    }
  } catch (e) {
    console.warn('saveSoloProgress exception:', e);
  }
}
