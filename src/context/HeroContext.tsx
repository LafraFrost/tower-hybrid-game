import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { GAME_DATA, type HeroName, type ILocalPlayerState, createPlayerState } from '@/data/GameData';

const STORAGE_KEY = 'tower_hybrid_hero_state';
const MODE_KEY = 'tower_hybrid_game_mode';

type GameMode = 'solo' | 'tabletop' | null;

interface HeroContextValue {
  playerState: ILocalPlayerState | null;
  selectedHero: HeroName | null;
  gameMode: GameMode;
  selectHero: (heroName: HeroName) => void;
  setGameMode: (mode: GameMode) => void;
  resetHero: () => void;
  loadLastSession: () => void;
  isInitialized: boolean;
}

const HeroContext = createContext<HeroContextValue | null>(null);

function loadSavedState(): ILocalPlayerState | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.heroName && GAME_DATA.HERO_STATS[parsed.heroName as HeroName]) {
        return parsed as ILocalPlayerState;
      }
    }
  } catch (e) {
    console.warn('Failed to load saved hero state:', e);
  }
  return null;
}

function loadSavedMode(): GameMode {
  try {
    const saved = localStorage.getItem(MODE_KEY);
    if (saved === 'solo' || saved === 'tabletop') {
      return saved;
    }
  } catch (e) {
    console.warn('Failed to load saved game mode:', e);
  }
  return null;
}

function saveState(state: ILocalPlayerState | null) {
  try {
    if (state) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) {
    console.warn('Failed to save hero state:', e);
  }
}

function saveMode(mode: GameMode) {
  try {
    if (mode) {
      localStorage.setItem(MODE_KEY, mode);
    } else {
      localStorage.removeItem(MODE_KEY);
    }
  } catch (e) {
    console.warn('Failed to save game mode:', e);
  }
}

export function HeroProvider({ children }: { children: ReactNode }) {
  // Hydrate initial state from localStorage on mount
  const [playerState, setPlayerState] = useState<ILocalPlayerState | null>(() => loadSavedState());
  const [selectedHero, setSelectedHero] = useState<HeroName | null>(() => {
    const saved = loadSavedState();
    return saved?.heroName || null;
  });
  const [gameMode, setGameModeState] = useState<GameMode>(() => loadSavedMode());

  // Save state to localStorage whenever it changes
  useEffect(() => {
    saveState(playerState);
  }, [playerState]);

  useEffect(() => {
    saveMode(gameMode);
  }, [gameMode]);

  const selectHero = useCallback((heroName: HeroName) => {
    const state = createPlayerState(heroName);
    setPlayerState(state);
    setSelectedHero(heroName);
  }, []);

  const setGameMode = useCallback((mode: GameMode) => {
    setGameModeState(mode);
  }, []);

  const resetHero = useCallback(() => {
    setPlayerState(null);
    setSelectedHero(null);
    setGameModeState(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(MODE_KEY);
  }, []);

  const loadLastSession = useCallback(() => {
    // Load saved state from localStorage (simulating database load)
    const saved = loadSavedState();
    if (saved) {
      setPlayerState(saved);
      setSelectedHero(saved.heroName);
    } else {
      // If no saved state, create a default hero for demo
      const defaultHero: HeroName = 'Ombra';
      const state = createPlayerState(defaultHero);
      setPlayerState(state);
      setSelectedHero(defaultHero);
    }
  }, []);

  return (
    <HeroContext.Provider value={{
      playerState,
      selectedHero,
      gameMode,
      selectHero,
      setGameMode,
      resetHero,
      loadLastSession,
      isInitialized: playerState !== null,
    }}>
      {children}
    </HeroContext.Provider>
  );
}

export function useHero() {
  const context = useContext(HeroContext);
  if (!context) {
    throw new Error('useHero must be used within a HeroProvider');
  }
  return context;
}

export { GAME_DATA };
