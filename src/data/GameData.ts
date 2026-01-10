export type AIPriority = 'HIGH_DMG_HERO' | 'LOW_HP_HERO' | 'HIGH_DEF_HERO' | 'NEAREST';

export interface EnemyStats {
  HP_BASE: number;
  DMG_BASE: number;
  DEF_BASE: number;
  MOV: number;
  AI_PRIORITY: AIPriority;
  SPECIAL?: string;
}

export const GAME_DATA = {
  ENEMY_STATS: {
    FanteOssuto: { 
      HP_BASE: 5, 
      DMG_BASE: 2, 
      DEF_BASE: 0, 
      MOV: 2, 
      AI_PRIORITY: 'HIGH_DMG_HERO' as AIPriority
    },
    IntercettoreVeloce: { 
      HP_BASE: 12, 
      DMG_BASE: 3, 
      DEF_BASE: 1, 
      MOV: 3, 
      AI_PRIORITY: 'LOW_HP_HERO' as AIPriority
    },
    GroviglioDiCenere: { 
      HP_BASE: 30, 
      DMG_BASE: 4, 
      DEF_BASE: 3, 
      MOV: 1, 
      AI_PRIORITY: 'HIGH_DEF_HERO' as AIPriority,
      SPECIAL: 'SPAWN_FANTI'
    },
    Sentinella: {
      HP_BASE: 10,
      DMG_BASE: 3,
      DEF_BASE: 1,
      MOV: 2,
      AI_PRIORITY: 'NEAREST' as AIPriority
    },
    CustodeDellaTorre: {
      HP_BASE: 40,
      DMG_BASE: 6,
      DEF_BASE: 4,
      MOV: 1,
      AI_PRIORITY: 'HIGH_DMG_HERO' as AIPriority,
      SPECIAL: 'BOSS_PHASE'
    }
  } as Record<string, EnemyStats>,

  HERO_STATS: {
    // TANK
    Baluardo: { class: 'Tank', HP_BASE: 15, DEF_INIT: 1, R2_NAME: 'Furore', R2_MAX: 5 },
    Sentinella: { class: 'Tank', HP_BASE: 14, DEF_INIT: 2, R2_NAME: 'Vigore', R2_MAX: 4 },
    // DPS
    Ombra: { class: 'DPS', HP_BASE: 12, DEF_INIT: 0, R2_NAME: 'Energia', R2_MAX: 4 },
    Assassina: { class: 'DPS', HP_BASE: 11, DEF_INIT: 0, R2_NAME: 'Veleno', R2_MAX: 5 },
    // CONTROL
    Cronomante: { class: 'Control', HP_BASE: 10, DEF_INIT: 0, R2_NAME: 'Mana', R2_MAX: 6 },
    Elementalista: { class: 'Control', HP_BASE: 10, DEF_INIT: 0, R2_NAME: 'Carica', R2_MAX: 5 },
    // SUPPORT
    Archivista: { class: 'Support', HP_BASE: 11, DEF_INIT: 0, R2_NAME: 'Fede', R2_MAX: 4 },
    Mistica: { class: 'Support', HP_BASE: 10, DEF_INIT: 0, R2_NAME: 'Illusione', R2_MAX: 4 },
    // SPECIALIST
    Ingegnere: { class: 'Specialist', HP_BASE: 13, DEF_INIT: 1, R2_NAME: 'Scrap', R2_MAX: 5 },
    Predatore: { class: 'Specialist', HP_BASE: 14, DEF_INIT: 0, R2_NAME: 'Istinto', R2_MAX: 5 },
  },

  HERO_ABILITIES: {
    Baluardo: [
      { name: "Muro di Carne", paCost: 1, r2Cost: 2, description: "Guadagni +6 Difesa. Attira i nemici." },
      { name: "Onda d'Urto", paCost: 2, r2Cost: 3, description: "Danno 4, Respinge nemici." },
    ],
    Sentinella: [
      { name: "Guardia Reale", paCost: 1, r2Cost: 1, description: "Assorbi danni per un alleato vicino." },
      { name: "Contrattacco", paCost: 2, r2Cost: 3, description: "Infliggi danni pari ai danni subiti." },
    ],
    Ombra: [
      { name: "Teletrasporto", paCost: 0, r2Cost: 1, description: "Muovi istantaneamente di 4 celle." },
      { name: "Lama Fantasma", paCost: 3, r2Cost: 3, description: "Danno 8, ignora armatura." },
    ],
    Assassina: [
      { name: "Colpo Vitale", paCost: 2, r2Cost: 2, description: "Danno 5, +3 se nemico isolato." },
      { name: "Bomba Foglie", paCost: 1, r2Cost: 2, description: "Diventi invisibile per 1 turno." },
    ],
    Cronomante: [
      { name: "Stasi", paCost: 2, r2Cost: 4, description: "Nemico salta il prossimo turno." },
      { name: "Rewind", paCost: 0, r2Cost: 2, description: "Torna alla posizione precedente." },
    ],
    Elementalista: [
      { name: "Muro di Fuoco", paCost: 2, r2Cost: 3, description: "Crea area dannosa (3 dmg/turno)." },
      { name: "Gelo", paCost: 1, r2Cost: 2, description: "Riduce movimento nemico a 0." },
    ],
    Archivista: [
      { name: "Cura", paCost: 1, r2Cost: 2, description: "Cura 5 HP ad alleato." },
      { name: "Scudo Sacro", paCost: 2, r2Cost: 3, description: "Alleato immune al prossimo danno." },
    ],
    Mistica: [
      { name: "Specchio", paCost: 2, r2Cost: 3, description: "Crea copia illusoria." },
      { name: "Confusione", paCost: 1, r2Cost: 2, description: "Nemico attacca alleato più vicino." },
    ],
    Ingegnere: [
      { name: "Torretta", paCost: 3, r2Cost: 5, description: "Piazza torretta automatica (2 dmg)." },
      { name: "Riparazione", paCost: 1, r2Cost: 1, description: "Cura se stesso o torretta." },
    ],
    Predatore: [
      { name: "Trappola", paCost: 1, r2Cost: 2, description: "Blocca nemico che entra nella cella." },
      { name: "Richiamo", paCost: 0, r2Cost: 1, description: "Segna bersaglio (+2 danni ricevuti)." },
    ],
  },

  BASE_CARDS: [
    { id: 'card_1', name: "Colpo Rapido", paCost: 1, type: "Attack", comboSymbol: "Volt" as ComboSymbol, value: 3, description: "Attacco rapido che infligge 3 danni" },
    { id: 'card_2', name: "Attacco Standard", paCost: 2, type: "Attack", comboSymbol: "Fire" as ComboSymbol, value: 5, description: "Attacco potenziato che infligge 5 danni" },
    { id: 'card_3', name: "Preparazione", paCost: 1, type: "Defense", comboSymbol: "Shield" as ComboSymbol, value: 4, description: "Ottieni 4 punti scudo" },
    { id: 'card_4', name: "Spinta Tattica", paCost: 1, type: "Movement", comboSymbol: "Link" as ComboSymbol, value: 2, description: "Movimento tattico avanzato" },
    { id: 'card_5', name: "Curazione Leggera", paCost: 2, type: "Heal", comboSymbol: "Link" as ComboSymbol, value: 4, description: "Recupera 4 HP" },
    { id: 'card_6', name: "Ricarica Mente", paCost: 1, type: "Utility", comboSymbol: "Volt" as ComboSymbol, value: 1, description: "Ricarica risorse mentali" },
    { id: 'card_7', name: "Debolezza Esposta", paCost: 2, type: "Debuff", comboSymbol: "Fire" as ComboSymbol, value: 2, description: "Riduce la difesa nemica" },
    { id: 'card_8', name: "Tregua Breve", paCost: 0, type: "Utility", comboSymbol: "Shield" as ComboSymbol, value: 0, description: "Momento di pausa tattica" },
  ],

  CLASS_COLORS: {
    Tank: { primary: 'cyan', bg: 'bg-cyan-500/20', border: 'border-cyan-500', text: 'text-cyan-400' },
    DPS: { primary: 'red', bg: 'bg-red-500/20', border: 'border-red-500', text: 'text-red-400' },
    Control: { primary: 'purple', bg: 'bg-purple-500/20', border: 'border-purple-500', text: 'text-purple-400' },
    Support: { primary: 'green', bg: 'bg-green-500/20', border: 'border-green-500', text: 'text-green-400' },
    Specialist: { primary: 'yellow', bg: 'bg-yellow-500/20', border: 'border-yellow-500', text: 'text-yellow-400' },
  },
} as const;

export type HeroName = keyof typeof GAME_DATA.HERO_STATS;
export type HeroClass = 'Tank' | 'DPS' | 'Control' | 'Support' | 'Specialist';
export type CardType = 'Attack' | 'Defense' | 'Movement' | 'Heal' | 'Utility' | 'Debuff';

export interface HeroProfile {
  id: string;
  name: HeroName;
  class: HeroClass;
  hp: number;
  def: number;
  resourceMax: number;
  initialDeck: string[];
}

export const HERO_PROFILES: Record<HeroName, HeroProfile> = {
  Baluardo: {
    id: 'baluardo',
    name: 'Baluardo',
    class: 'Tank',
    hp: 15,
    def: 1,
    resourceMax: 5,
    initialDeck: ['card_3', 'card_3', 'card_3', 'card_2', 'card_2', 'card_2', 'card_5', 'card_5'],
  },
  Sentinella: {
    id: 'sentinella',
    name: 'Sentinella',
    class: 'Tank',
    hp: 14,
    def: 2,
    resourceMax: 4,
    initialDeck: ['card_3', 'card_3', 'card_3', 'card_2', 'card_2', 'card_2', 'card_5', 'card_5'],
  },
  Ombra: {
    id: 'ombra',
    name: 'Ombra',
    class: 'DPS',
    hp: 12,
    def: 0,
    resourceMax: 4,
    initialDeck: ['card_1', 'card_1', 'card_2', 'card_2', 'card_6', 'card_8', 'card_3', 'card_3'],
  },
  Assassina: {
    id: 'assassina',
    name: 'Assassina',
    class: 'DPS',
    hp: 11,
    def: 0,
    resourceMax: 5,
    initialDeck: ['card_1', 'card_1', 'card_2', 'card_2', 'card_6', 'card_8', 'card_3', 'card_3'],
  },
  Cronomante: {
    id: 'cronomante',
    name: 'Cronomante',
    class: 'Control',
    hp: 10,
    def: 0,
    resourceMax: 6,
    initialDeck: ['card_6', 'card_6', 'card_5', 'card_8', 'card_3', 'card_3', 'card_3', 'card_1'],
  },
  Elementalista: {
    id: 'elementalista',
    name: 'Elementalista',
    class: 'Control',
    hp: 10,
    def: 0,
    resourceMax: 5,
    initialDeck: ['card_6', 'card_6', 'card_5', 'card_8', 'card_3', 'card_3', 'card_3', 'card_1'],
  },
  Archivista: {
    id: 'archivista',
    name: 'Archivista',
    class: 'Support',
    hp: 11,
    def: 0,
    resourceMax: 4,
    initialDeck: ['card_6', 'card_5', 'card_5', 'card_8', 'card_3', 'card_3', 'card_3', 'card_1'],
  },
  Mistica: {
    id: 'mistica',
    name: 'Mistica',
    class: 'Support',
    hp: 10,
    def: 0,
    resourceMax: 4,
    initialDeck: ['card_6', 'card_5', 'card_5', 'card_8', 'card_3', 'card_3', 'card_3', 'card_1'],
  },
  Ingegnere: {
    id: 'ingegnere',
    name: 'Ingegnere',
    class: 'Specialist',
    hp: 13,
    def: 1,
    resourceMax: 5,
    initialDeck: ['card_6', 'card_6', 'card_2', 'card_2', 'card_3', 'card_3', 'card_5', 'card_5'],
  },
  Predatore: {
    id: 'predatore',
    name: 'Predatore',
    class: 'Specialist',
    hp: 14,
    def: 0,
    resourceMax: 5,
    initialDeck: ['card_6', 'card_6', 'card_2', 'card_2', 'card_3', 'card_3', 'card_5', 'card_5'],
  },
};

export interface HeroAbility {
  name: string;
  paCost: number;
  r2Cost: number;
  description: string;
}

export type ComboSymbol = 'Fire' | 'Volt' | 'Shield' | 'Link';

export const COMBO_SYMBOL_EMOJI: Record<ComboSymbol, string> = {
  Fire: '🔥',
  Volt: '⚡',
  Shield: '🛡️',
  Link: '🔗',
};

export interface GameCard {
  id: string;
  name: string;
  paCost: number;
  type: CardType;
  comboSymbol: ComboSymbol;
  value?: number;
  description: string;
}

export const CARD_DATA: Record<string, GameCard> = GAME_DATA.BASE_CARDS.reduce(
  (acc, card) => {
    acc[card.id] = card;
    return acc;
  },
  {} as Record<string, GameCard>
);

export interface IUnit {
  id: string;
  type: 'hero' | 'enemy';
  heroClass?: HeroClass;
  currentHP: number;
  maxHP: number;
  currentPA?: number;
  currentR2?: number;
  gridCoords: string;
  activeBuffs: string[];
  heroName?: string;
  isReady?: boolean;
}

export interface ILocalPlayerState {
  heroName: HeroName;
  currentHP: number;
  maxHP: number;
  currentPA: number;
  maxPA: number;
  currentR2: number;
  maxR2: number;
  r2Name: string;
  defense: number;
  heroClass: HeroClass;
  hand: GameCard[];
  abilities: HeroAbility[];
}

export type GameMode = 'SOLO' | 'TABLETOP';

export function getHeroData(heroName: HeroName, mode: GameMode) {
  if (mode === 'SOLO') {
    return HERO_PROFILES[heroName];
  }

  return {
    stats: GAME_DATA.HERO_STATS[heroName],
    abilities: GAME_DATA.HERO_ABILITIES[heroName],
  };
}

export function createPlayerState(heroName: HeroName): ILocalPlayerState {
  const stats = GAME_DATA.HERO_STATS[heroName];
  const abilities = GAME_DATA.HERO_ABILITIES[heroName];
  
  return {
    heroName,
    currentHP: stats.HP_BASE,
    maxHP: stats.HP_BASE,
    currentPA: 3,
    maxPA: 3,
    currentR2: 0,
    maxR2: stats.R2_MAX,
    r2Name: stats.R2_NAME,
    defense: stats.DEF_INIT,
    heroClass: stats.class as HeroClass,
    hand: [...GAME_DATA.BASE_CARDS].slice(0, 5),
    abilities: [...abilities],
  };
}
