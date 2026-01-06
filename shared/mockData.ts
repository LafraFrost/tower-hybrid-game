// Mock data for fallback when database is unavailable
import type { User, DailyQuest, Game, Unit, Card, NarrativeEvent, MapNode } from './schema';

export const mockUser: User = {
  id: 1,
  username: 'Ombra',
  xp: 150,
  bonusHp: 2,
  bonusPa: 1,
  bonusR2: 1,
  createdAt: new Date()
};

export const mockDailyQuests: DailyQuest[] = [
  {
    id: 1,
    userId: 1,
    description: "Esegui 10 piegamenti",
    rewardXp: 50,
    rewardStatType: "HP",
    rewardStatValue: 1,
    isCompleted: false,
    completedAt: null,
    createdAt: new Date()
  },
  {
    id: 2,
    userId: 1,
    description: "Bevi 2L di acqua",
    rewardXp: 30,
    rewardStatType: "R2",
    rewardStatValue: 1,
    isCompleted: false,
    completedAt: null,
    createdAt: new Date()
  },
  {
    id: 3,
    userId: 1,
    description: "Cammina 5000 passi",
    rewardXp: 40,
    rewardStatType: "PA",
    rewardStatValue: 1,
    isCompleted: true,
    completedAt: new Date(),
    createdAt: new Date()
  }
];

export const mockMapNodes: MapNode[] = [
  { id: 'node_1', type: 'START', x: 10, y: 50, connections: ['node_2', 'node_3'], isVisited: true, label: 'Start' },
  { id: 'node_2', type: 'COMBAT', x: 30, y: 30, connections: ['node_4', 'node_5'], isVisited: false, label: 'Ambush' },
  { id: 'node_3', type: 'EVENT', x: 30, y: 70, connections: ['node_5', 'node_6'], isVisited: false, label: 'Event' },
  { id: 'node_4', type: 'SHOP', x: 50, y: 20, connections: ['node_7'], isVisited: false, label: 'Merchant' },
  { id: 'node_5', type: 'ELITE', x: 50, y: 50, connections: ['node_7'], isVisited: false, label: 'Elite' },
  { id: 'node_6', type: 'COMBAT', x: 50, y: 80, connections: ['node_7'], isVisited: false, label: 'Guard' },
  { id: 'node_7', type: 'BOSS', x: 90, y: 50, connections: [], isVisited: false, label: 'Boss' }
];

export const mockGame: Game = {
  id: 1,
  status: 'MAP',
  currentTurn: 1,
  activeUnitId: null,
  gridState: [],
  mapState: mockMapNodes,
  currentLevel: 1
};

export const mockUnits: Unit[] = [
  {
    id: 1,
    gameId: 1,
    type: 'HERO',
    name: 'Ombra',
    class: 'DPS',
    hp: 12,
    maxHp: 12,
    pa: 3,
    r2: 4,
    x: 0,
    y: 0,
    ownerId: 1
  },
  {
    id: 2,
    gameId: 1,
    type: 'ENEMY',
    name: 'Drone',
    class: 'Scout',
    hp: 6,
    maxHp: 6,
    pa: 2,
    r2: 0,
    x: 4,
    y: 2,
    ownerId: null
  }
];

export const mockCards: Card[] = [
  { id: 1, gameId: 1, userId: 1, name: "Colpo Rapido", type: "Attack", paCost: 1, description: "Infligge 3 danni.", status: "HAND" },
  { id: 2, gameId: 1, userId: 1, name: "Schivata", type: "Defense", paCost: 1, description: "Annulla il prossimo attacco.", status: "HAND" },
  { id: 3, gameId: 1, userId: 1, name: "Palla di Fuoco", type: "Attack", paCost: 2, description: "Infligge 5 danni ad area.", status: "HAND" },
  { id: 4, gameId: 1, userId: 1, name: "Avanzata", type: "Movement", paCost: 1, description: "Muovi di 2 celle.", status: "DECK" },
  { id: 5, gameId: 1, userId: 1, name: "Scudo Plasma", type: "Defense", paCost: 2, description: "Blocca 4 danni.", status: "DECK" }
];

export const mockNarrativeEvents: NarrativeEvent[] = [
  {
    id: 1,
    title: "Il Terminale Corrotto",
    description: "Trovi un vecchio terminale che emette scintille azzurre.",
    optionA: { text: "Hacker: Tenta il recupero dati.", consequences: [{ type: "CARDS", value: 2, probability: 0.5 }, { type: "HP", value: -3, probability: 0.5 }] },
    optionB: { text: "Ignora: Prosegui sicuro.", consequences: [{ type: "PA", value: 1 }] }
  },
  {
    id: 2,
    title: "Il Mercante d'Ombre",
    description: "Una figura mantellata ti offre un patto nel buio.",
    optionA: { text: "Sacrificio: Cedi 4 HP massimi.", consequences: [{ type: "MAX_HP", value: -4 }, { type: "ULTIMATE", value: true }] },
    optionB: { text: "Rifiuta: Il mercante sparisce ridendo.", consequences: [] }
  },
  {
    id: 3,
    title: "Sorgente di Plasma",
    description: "Una perdita di energia pura illumina il corridoio.",
    optionA: { text: "Assorbi: Ricarica completamente la barra R2.", consequences: [{ type: "R2_FULL", value: true }] },
    optionB: { text: "Stabilizza: Cura 5 HP a tutto il team.", consequences: [{ type: "TEAM_HEAL", value: 5 }] }
  }
];
