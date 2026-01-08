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
    console.log('📡 [progressService] Loading solo progress from DB for:', heroName);
    const { data, error } = await supabase
      .from(TABLE)
      .select('hero_name, hero_class, persistent_credits, persistent_deck_cards, solo_progress')
      .eq('hero_name', heroName)
      .maybeSingle();

    if (error) {
      console.warn('⚠️ [progressService] Supabase loadSoloProgress error:', error);
      return null;
    }

    console.log('📦 [progressService] Raw data from DB:', data);
    const progress = (data as any)?.solo_progress as SoloProgress | undefined;
    if (progress && typeof progress.currentNode === 'number') {
      console.log('✅ [progressService] Valid progress found:', progress);
      return progress;
    }
    console.log('ℹ️ [progressService] No valid progress in DB');
  } catch (e) {
    console.warn('❌ [progressService] loadSoloProgress exception:', e);
  }
  return null;
}

export async function saveSoloProgress(heroName: string, heroClass: string, progress: SoloProgress) {
  try {
    console.log('💾 [progressService] Saving solo progress to DB:', { heroName, progress });
    const payload = {
      hero_name: heroName,
      hero_class: heroClass || 'Unknown',
      solo_progress: progress,
      updated_at: new Date().toISOString(),
    } as any;

    const { data, error } = await supabase
      .from(TABLE)
      .upsert(payload, { onConflict: 'hero_name' });

    if (error) {
      console.warn('⚠️ [progressService] Supabase saveSoloProgress error:', error);
    } else {
      console.log('✅ [progressService] Progress saved successfully');
      console.log('📊 [progressService] Saved data:', { data, payload });
      
      // Verify immediately after save
      const { data: verifyData, error: verifyError } = await supabase
        .from(TABLE)
        .select('solo_progress')
        .eq('hero_name', heroName)
        .maybeSingle();
      
      if (verifyError) {
        console.warn('❌ [progressService] Verify error:', verifyError);
      } else {
        const savedProgress = (verifyData as any)?.solo_progress;
        console.log('🔍 [progressService] Verify after save:', savedProgress);
        if (savedProgress?.currentNode !== progress.currentNode) {
          console.warn('⚠️ [progressService] DATA MISMATCH! Saved:', progress.currentNode, 'But DB has:', savedProgress?.currentNode);
        }
      }
    }
  } catch (e) {
    console.warn('❌ [progressService] saveSoloProgress exception:', e);
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
