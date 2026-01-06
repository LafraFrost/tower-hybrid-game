export interface IUnit {
    id: string; // "Ombra", "Baluardo", "Fante_1"
    type: 'hero' | 'enemy';
    heroClass?: string; // "Tank", "DPS", "Control", "Support", "Specialist"
    currentHP: number;
    maxHP: number;
    currentPA?: number; // Solo per eroi
    currentR2?: number; // Solo per eroi
    gridCoords: string; // "x,y" (es. "3,2")
    activeBuffs: string[]; // Es. ["Difesa+3", "Veleno"]
    heroName?: string;
    isReady?: boolean;
}

export interface INode {
    nodeID: string;
    type: 'Combat' | 'Shop' | 'Puzzle' | 'Goal' | 'Start' | 'Combat_Hard' | 'EVENT' | 'REST';
    isVisited: boolean;
    connections: string[]; // ID dei nodi connessi
    coords: string; // Per la posizione grafica sulla mappa globale "x,y" percentuali
    label: string;
}

export interface IMapLayout {
    dungeonLevel: number;
    nodes: INode[];
    heroPositions: { [heroId: string]: string }; // { "Ombra": "nodeID_X" }
}

export interface ICombatState {
    combatID: string;
    gridSize: string; // "6x5"
    gridEffects: Array<{ coords: string; effect: string }>; // Es. [{ coords: "3,2", effect: "Copertura" }]
    units: { [unitId: string]: IUnit }; // Tutti i personaggi e nemici in combattimento
    currentTurnUnitId: string; // "Ombra", "Fante_1"
    turnOrder: string[]; // ["Ombra", "Fante_1", "Baluardo", "Fante_2"]
}

export interface ILiveGameState {
    gameID: string;
    currentPhase: 'LOBBY' | 'MAPPA_GLOBALE' | 'COMBATTIMENTO' | 'SHOP' | 'SETUP';
    playersCount: number; // N
    connectedHeroes: string[]; // List of hero IDs currently selected
    currentTurn: string;
    turnOrder: string[];
    dungeonLevel: number;
    mapData?: IMapLayout;
    combatData?: ICombatState;
}

// Command structure for localStorage queue
export interface IGameAction {
    id: string;
    timestamp: number;
    action: 'MOVE' | 'ABILITY' | 'END_TURN' | 'JOIN_LOBBY';
    payload: any;
}