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
    // Hero Signature Cards (2 per hero with matching comboSymbol)
    // Baluardo - Tank
    { id: 'sig_baluardo_1', name: "Onda d'Urto", paCost: 2, type: "Attack", comboSymbol: "Shield", value: 4, description: "Attacco difensivo del Baluardo" },
    { id: 'sig_baluardo_2', name: "Muro di Carne", paCost: 1, type: "Defense", comboSymbol: "Shield", value: 6, description: "Difesa impenetrabile" },
    // Sentinella - Tank
    { id: 'sig_sentinella_1', name: "Guardia Assoluta", paCost: 2, type: "Defense", comboSymbol: "Shield", value: 5, description: "Posizione difensiva della Sentinella" },
    { id: 'sig_sentinella_2', name: "Controffensiva", paCost: 1, type: "Attack", comboSymbol: "Shield", value: 4, description: "Risposta letale" },
    // Ombra - DPS
    { id: 'sig_ombra_1', name: "Lama Oscura", paCost: 2, type: "Attack", comboSymbol: "Volt", value: 6, description: "Attacco fulmineo dell'Ombra" },
    { id: 'sig_ombra_2', name: "Passo Fantasma", paCost: 1, type: "Attack", comboSymbol: "Volt", value: 4, description: "Colpo invisibile" },
    // Assassina - DPS
    { id: 'sig_assassina_1', name: "Veleno Letale", paCost: 2, type: "Attack", comboSymbol: "Volt", value: 5, description: "Tossina mortale dell'Assassina" },
    { id: 'sig_assassina_2', name: "Stiletto Rapido", paCost: 1, type: "Attack", comboSymbol: "Volt", value: 5, description: "Colpo preciso e veloce" },
    // Cronomante - Control
    { id: 'sig_cronomante_1', name: "Distorsione Temporale", paCost: 2, type: "Utility", comboSymbol: "Link", value: 3, description: "Manipolazione del tempo del Cronomante" },
    { id: 'sig_cronomante_2', name: "Eco Futuro", paCost: 1, type: "Utility", comboSymbol: "Link", value: 2, description: "Visione anticipata" },
    // Elementalista - Control
    { id: 'sig_elementalista_1', name: "Tempesta Elementale", paCost: 2, type: "Attack", comboSymbol: "Fire", value: 6, description: "Furia degli elementi" },
    { id: 'sig_elementalista_2', name: "Catalizzatore", paCost: 1, type: "Utility", comboSymbol: "Fire", value: 3, description: "Amplifica la magia elementale" },
    // Archivista - Support
    { id: 'sig_archivista_1', name: "Tomo Sacro", paCost: 2, type: "Heal", comboSymbol: "Link", value: 5, description: "Saggezza curativa dell'Archivista" },
    { id: 'sig_archivista_2', name: "Benedizione", paCost: 1, type: "Heal", comboSymbol: "Link", value: 4, description: "Grazia divina" },
    // Mistica - Support
    { id: 'sig_mistica_1', name: "Illusione Perfetta", paCost: 2, type: "Utility", comboSymbol: "Link", value: 4, description: "Inganno mistico della Mistica" },
    { id: 'sig_mistica_2', name: "Velo Arcano", paCost: 1, type: "Defense", comboSymbol: "Link", value: 5, description: "Protezione illusoria" },
    // Ingegnere - Specialist
    { id: 'sig_ingegnere_1', name: "Torretta MK-II", paCost: 2, type: "Attack", comboSymbol: "Fire", value: 5, description: "Dispositivo d'attacco avanzato" },
    { id: 'sig_ingegnere_2', name: "Kit Riparazione", paCost: 1, type: "Heal", comboSymbol: "Fire", value: 4, description: "Recupero tecnico" },
    // Predatore - Specialist
    { id: 'sig_predatore_1', name: "Trappola Letale", paCost: 2, type: "Attack", comboSymbol: "Volt", value: 5, description: "Caccia perfetta del Predatore" },
    { id: 'sig_predatore_2', name: "Istinto Selvaggio", paCost: 1, type: "Attack", comboSymbol: "Volt", value: 4, description: "Ferocia primordiale" },
    
    // Common Cards (no comboSymbol)
    { id: 'card_atk_base', name: "Attacco Base", paCost: 1, type: "Attack", value: 3, description: "Attacco standard" },
    { id: 'card_def_base', name: "Difesa Base", paCost: 1, type: "Defense", value: 3, description: "Difesa standard" },
    { id: 'card_heal_base', name: "Cura Base", paCost: 2, type: "Heal", value: 4, description: "Recupero base" },
    { id: 'card_util_base', name: "Utilità Base", paCost: 1, type: "Utility", value: 1, description: "Azione tattica" },
    { id: 'card_move_base', name: "Movimento Base", paCost: 1, type: "Movement", value: 2, description: "Spostamento tattico" },
    { id: 'card_debuff_base', name: "Indebolimento", paCost: 2, type: "Debuff", value: 2, description: "Riduce difesa nemica" },
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
    initialDeck: ['sig_baluardo_1', 'sig_baluardo_2', 'card_atk_base', 'card_atk_base', 'card_def_base', 'card_def_base', 'card_heal_base', 'card_util_base'],
  },
  Sentinella: {
    id: 'sentinella',
    name: 'Sentinella',
    class: 'Tank',
    hp: 14,
    def: 2,
    resourceMax: 4,
    initialDeck: ['sig_sentinella_1', 'sig_sentinella_2', 'card_atk_base', 'card_atk_base', 'card_def_base', 'card_def_base', 'card_heal_base', 'card_util_base'],
  },
  Ombra: {
    id: 'ombra',
    name: 'Ombra',
    class: 'DPS',
    hp: 12,
    def: 0,
    resourceMax: 4,
    initialDeck: ['sig_ombra_1', 'sig_ombra_2', 'card_atk_base', 'card_atk_base', 'card_def_base', 'card_move_base', 'card_util_base', 'card_debuff_base'],
  },
  Assassina: {
    id: 'assassina',
    name: 'Assassina',
    class: 'DPS',
    hp: 11,
    def: 0,
    resourceMax: 5,
    initialDeck: ['sig_assassina_1', 'sig_assassina_2', 'card_atk_base', 'card_atk_base', 'card_def_base', 'card_move_base', 'card_util_base', 'card_debuff_base'],
  },
  Cronomante: {
    id: 'cronomante',
    name: 'Cronomante',
    class: 'Control',
    hp: 10,
    def: 0,
    resourceMax: 6,
    initialDeck: ['sig_cronomante_1', 'sig_cronomante_2', 'card_atk_base', 'card_def_base', 'card_heal_base', 'card_util_base', 'card_move_base', 'card_debuff_base'],
  },
  Elementalista: {
    id: 'elementalista',
    name: 'Elementalista',
    class: 'Control',
    hp: 10,
    def: 0,
    resourceMax: 5,
    initialDeck: ['sig_elementalista_1', 'sig_elementalista_2', 'card_atk_base', 'card_def_base', 'card_heal_base', 'card_util_base', 'card_move_base', 'card_debuff_base'],
  },
  Archivista: {
    id: 'archivista',
    name: 'Archivista',
    class: 'Support',
    hp: 11,
    def: 0,
    resourceMax: 4,
    initialDeck: ['sig_archivista_1', 'sig_archivista_2', 'card_atk_base', 'card_def_base', 'card_heal_base', 'card_heal_base', 'card_util_base', 'card_move_base'],
  },
  Mistica: {
    id: 'mistica',
    name: 'Mistica',
    class: 'Support',
    hp: 10,
    def: 0,
    resourceMax: 4,
    initialDeck: ['sig_mistica_1', 'sig_mistica_2', 'card_atk_base', 'card_def_base', 'card_heal_base', 'card_heal_base', 'card_util_base', 'card_move_base'],
  },
  Ingegnere: {
    id: 'ingegnere',
    name: 'Ingegnere',
    class: 'Specialist',
    hp: 13,
    def: 1,
    resourceMax: 5,
    initialDeck: ['sig_ingegnere_1', 'sig_ingegnere_2', 'card_atk_base', 'card_def_base', 'card_heal_base', 'card_util_base', 'card_move_base', 'card_debuff_base'],
  },
  Predatore: {
    id: 'predatore',
    name: 'Predatore',
    class: 'Specialist',
    hp: 14,
    def: 0,
    resourceMax: 5,
    initialDeck: ['sig_predatore_1', 'sig_predatore_2', 'card_atk_base', 'card_def_base', 'card_heal_base', 'card_util_base', 'card_move_base', 'card_debuff_base'],
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
  comboSymbol?: ComboSymbol;
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

// Hero Signature Card Mapping: Each hero has exactly 2 signature cards for their special combo
export const HERO_SIGNATURE_CARDS: Record<HeroName, [string, string]> = {
  Baluardo: ['sig_baluardo_1', 'sig_baluardo_2'],
  Sentinella: ['sig_sentinella_1', 'sig_sentinella_2'],
  Ombra: ['sig_ombra_1', 'sig_ombra_2'],
  Assassina: ['sig_assassina_1', 'sig_assassina_2'],
  Cronomante: ['sig_cronomante_1', 'sig_cronomante_2'],
  Elementalista: ['sig_elementalista_1', 'sig_elementalista_2'],
  Archivista: ['sig_archivista_1', 'sig_archivista_2'],
  Mistica: ['sig_mistica_1', 'sig_mistica_2'],
  Ingegnere: ['sig_ingegnere_1', 'sig_ingegnere_2'],
  Predatore: ['sig_predatore_1', 'sig_predatore_2'],
};

export function getHeroSignatureSymbol(heroName: HeroName): ComboSymbol {
  const [sigCardId] = HERO_SIGNATURE_CARDS[heroName];
  const card = CARD_DATA[sigCardId];
  return card?.comboSymbol || 'Fire';
}

export function isSignatureCombo(heroName: HeroName, cardId1: string, cardId2: string): boolean {
  const [sig1, sig2] = HERO_SIGNATURE_CARDS[heroName];
  return (cardId1 === sig1 && cardId2 === sig2) || (cardId1 === sig2 && cardId2 === sig1);
}

// QUESTA È LA RIGA CHE MANCAVA:
export function getHeroData(heroName: HeroName, mode: 'SOLO' | 'MULTI'): any {
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
  const profile = HERO_PROFILES[heroName];
  
  // Generate hand from hero's initial deck using CARD_DATA
  const initialHand: GameCard[] = profile.initialDeck
    .slice(0, 5)
    .map(cardId => CARD_DATA[cardId])
    .filter(card => card !== undefined);
  
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
    hand: initialHand,
    abilities: [...abilities],
  };
}