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

export async function loadProfile(heroName: string): Promise<{ credits: number; deckCards: string[] } | null> {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('persistent_credits, persistent_deck_cards')
      .eq('hero_name', heroName)
      .maybeSingle();
    if (error) {
      console.warn('Supabase loadProfile error:', error);
      return null;
    }
    return {
      credits: (data as any)?.persistent_credits ?? 100,
      deckCards: ((data as any)?.persistent_deck_cards ?? []) as string[],
    };
  } catch (e) {
    console.warn('loadProfile exception:', e);
    return null;
  }
}

export async function saveProfile(heroName: string, heroClass: string, payload: { credits: number; deckCards: string[] }) {
  try {
    const upsert = {
      hero_name: heroName,
      hero_class: heroClass || 'Unknown',
      persistent_credits: payload.credits,
      persistent_deck_cards: payload.deckCards,
      updated_at: new Date().toISOString(),
    } as any;
    const { error } = await supabase
      .from(TABLE)
      .upsert(upsert, { onConflict: 'hero_name' });
    if (error) {
      console.warn('Supabase saveProfile error:', error);
    }
  } catch (e) {
    console.warn('saveProfile exception:', e);
  }
}
