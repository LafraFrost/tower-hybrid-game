import { INode, IMapLayout } from './interfaces';

export const GAME_DATA = {
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
        { name: "Colpo Rapido", paCost: 1, type: "Attack" },
        { name: "Attacco Standard", paCost: 2, type: "Attack" },
        { name: "Preparazione", paCost: 1, type: "Defense" },
        { name: "Spinta Tattica", paCost: 1, type: "Movement" },
        { name: "Curazione Leggera", paCost: 2, type: "Heal" },
        { name: "Ricarica Mente", paCost: 1, type: "Utility" },
        { name: "Debolezza Esposta", paCost: 2, type: "Debuff" },
        { name: "Tregua Breve", paCost: 0, type: "Utility" },
    ],
    ENEMY_STATS: {
        FanteOssuto: { HP_BASE: 5, DMG_BASE: 2, DEF_BASE: 0, MOV: 2, AI_PRIORITY: "HIGH_DMG_HERO" },
        IntercettoreVeloce: { HP_BASE: 12, DMG_BASE: 3, DEF_BASE: 1, MOV: 3, AI_PRIORITY: "LOW_HP_HERO" },
        GroviglioDiCenere: { HP_BASE: 30, DMG_BASE: 4, DEF_BASE: 3, MOV: 1, AI_PRIORITY: "HIGH_DEF_HERO", SPECIAL: "Shielded by Fanti" },
    },
};

export function scaleEnemies(enemyBaseStats: any, N: number) {
    const scaleFactor = (1 + 0.5 * N);
    const scaledStats: { [key: string]: any } = {};
    for (const key in enemyBaseStats) {
        scaledStats[key] = {
            ...enemyBaseStats[key],
            HP_SCALED: Math.round(enemyBaseStats[key].HP_BASE * scaleFactor),
            DMG_SCALED: Math.round(enemyBaseStats[key].DMG_BASE * scaleFactor)
        };
    }
    return scaledStats;
}

// --- Map Generation Logic ---
export function generateRandomMap(level: number): IMapLayout {
    const nodes: INode[] = [];
    let nodeIdCounter = 1;

    // Helper to create node
    const createNode = (type: INode['type'], x: number, y: number, label: string): INode => ({
        nodeID: `node_${nodeIdCounter++}`,
        type,
        isVisited: false,
        connections: [],
        coords: `${x},${y}`,
        label
    });

    // 1. Start Node
    const startNode = createNode('Start', 10, 50, 'Entrance');
    startNode.isVisited = true;
    nodes.push(startNode);

    // 2. Layer 1 (2 nodes)
    const layer1 = [
        createNode('Combat', 30, 30, 'Ambush'),
        createNode('Puzzle', 30, 70, 'Riddle')
    ];
    nodes.push(...layer1);
    startNode.connections = layer1.map(n => n.nodeID);

    // 3. Layer 2 (3 nodes - Branching/Merging)
    const layer2 = [
        createNode('Shop', 50, 20, 'Merchant'),
        createNode('Combat_Hard', 50, 50, 'Elite'),
        createNode('Combat', 50, 80, 'Guard')
    ];
    nodes.push(...layer2);

    // Connect Layer 1 to Layer 2 randomly but forward
    layer1[0].connections = [layer2[0].nodeID, layer2[1].nodeID];
    layer1[1].connections = [layer2[1].nodeID, layer2[2].nodeID];

    // 4. Layer 3 (2 nodes - Converging)
    const layer3 = [
        createNode('Puzzle', 70, 40, 'Trap'),
        createNode('Shop', 70, 60, 'Rest')
    ];
    nodes.push(...layer3);
    
    layer2[0].connections = [layer3[0].nodeID];
    layer2[1].connections = [layer3[0].nodeID, layer3[1].nodeID];
    layer2[2].connections = [layer3[1].nodeID];

    // 5. Boss Node
    const bossNode = createNode('Goal', 90, 50, 'BOSS');
    nodes.push(bossNode);

    layer3[0].connections = [bossNode.nodeID];
    layer3[1].connections = [bossNode.nodeID];

    return {
        dungeonLevel: level,
        nodes,
        heroPositions: {} // Filled when game starts
    };
}