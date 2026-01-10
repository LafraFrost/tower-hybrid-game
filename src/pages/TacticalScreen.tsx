import React, { useEffect, useMemo, useState } from "react";
import { useHero } from "@/context/HeroContext";
import { loadSoloProgress, saveSoloProgress } from "@/lib/progressService";
import { useLocation } from "wouter";
import { CARD_DATA, HERO_PROFILES, COMBO_SYMBOL_EMOJI, HERO_SIGNATURE_CARDS, isSignatureCombo, getHeroSignatureSymbol, type GameCard, type HeroName, type ComboSymbol } from "@/data/GameData";
import { cn } from "@/lib/utils";

// Symbol color mapping for glow effects
const SYMBOL_COLORS: Record<ComboSymbol, { glow: string, shadow: string, border: string }> = {
  Fire: { glow: 'shadow-red-500/70', shadow: 'shadow-lg', border: 'border-red-400' },
  Volt: { glow: 'shadow-yellow-500/70', shadow: 'shadow-lg', border: 'border-yellow-400' },
  Shield: { glow: 'shadow-blue-500/70', shadow: 'shadow-lg', border: 'border-blue-400' },
  Link: { glow: 'shadow-purple-500/70', shadow: 'shadow-lg', border: 'border-purple-400' },
};

// Hero Signature Combo Names
const HERO_COMBO_NAMES: Record<HeroName, string> = {
  Baluardo: 'ERUZIONE DI FURORE',
  Sentinella: 'RITORSIONE TOTALE',
  Ombra: 'COLPO DALL\'OBLIO',
  Assassina: 'ESECUZIONE SILENZIOSA',
  Cronomante: 'DOMINIO TEMPORALE',
  Elementalista: 'SHOCK TERMICO',
  Archivista: 'INTERVENTO DIVINO',
  Mistica: 'ALLUCINAZIONE COLLETTIVA',
  Ingegnere: 'PROTOCOLLO OVERDRIVE',
  Predatore: 'IMBOSCATA MORTALE',
};

// Class-based color mappings for combo animations
const CLASS_GLOW_COLORS: Record<string, { primary: string, shadow: string }> = {
  Tank: { primary: '#06b6d4', shadow: 'rgba(6, 182, 212, 0.8)' }, // cyan
  DPS: { primary: '#ef4444', shadow: 'rgba(239, 68, 68, 0.8)' }, // red
  Control: { primary: '#a855f7', shadow: 'rgba(168, 85, 247, 0.8)' }, // purple
  Support: { primary: '#22c55e', shadow: 'rgba(34, 197, 94, 0.8)' }, // green
  Specialist: { primary: '#eab308', shadow: 'rgba(234, 179, 8, 0.8)' }, // yellow
};

type NodeType = "Combat" | "Event" | "Resource" | "Rest" | "Boss" | "Start";

type Node = {
  id: number;
  type: NodeType;
  label: string;
  x: number;
  y: number;
  connections: number[];
};

type BattleState = {
  enemyHp: number;
  playerHp: number;
  playerShield: number;
  baseDamage: number;
  pa: number;
  turnBonus: string;
  damageMultiplier: number;
  hand: GameCard[];
  deck: string[];
  discardPile: string[];
  feedbackMessage: string;
};

type Card = {
  id: string;
  name: string;
  desc: string;
  kind: "attack" | "defense" | "heal";
};

const cardDeck: Card[] = [
  { id: "atk1", name: "Attacco Rapido", desc: "Danno 4", kind: "attack" },
  { id: "atk2", name: "Affondo", desc: "Danno 4", kind: "attack" },
  { id: "atk3", name: "Colpo Pesante", desc: "Danno 4", kind: "attack" },
  { id: "atk4", name: "Doppio Taglio", desc: "Danno 4", kind: "attack" },
  { id: "def1", name: "Parata", desc: "Scudo 3", kind: "defense" },
  { id: "def2", name: "Guardia", desc: "Scudo 3", kind: "defense" },
  { id: "heal1", name: "Stim", desc: "Cura 3", kind: "heal" },
  { id: "heal2", name: "Medikit", desc: "Cura 3", kind: "heal" },
];

// Game constants
const MAX_HAND_SIZE = 6; // Maximum cards in hand (prevents overflow)

// Helper functions for deck system
const shuffleDeck = (deck: string[]): string[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Reshuffle function: takes discard pile and creates new shuffled deck
// Uses Fisher-Yates algorithm for perfect randomization
const reshuffle = (discardPile: string[]): { newDeck: string[], shouldLog: boolean } => {
  // If discard pile is empty, cannot reshuffle (all cards are in hand)
  if (discardPile.length === 0) {
    return { newDeck: [], shouldLog: false };
  }

  // Fisher-Yates shuffle algorithm for unbiased randomization
  const cards = [...discardPile];
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }

  return { newDeck: cards, shouldLog: true };
};

/**
 * Draw cards from deck with automatic reshuffle when needed
 * @param deck - Current deck (card IDs)
 * @param count - Number of cards to draw
 * @param discardPile - Current discard pile (card IDs)
 * @param currentHandSize - Current number of cards in hand (for MAX_HAND_SIZE check)
 * @returns Object with drawn cards, remaining deck, new discard pile, reshuffle flag, and overflow cards
 * 
 * Behavior:
 * - If deck has enough cards: draw normally
 * - If deck is empty: automatically reshuffle discard pile using Fisher-Yates
 * - If hand is full (MAX_HAND_SIZE): excess cards go directly to discard pile
 * - Each drawn card gets unique ID to prevent React rendering confusion
 */
const drawCards = (deck: string[], count: number, discardPile: string[] = [], currentHandSize: number = 0): { drawn: GameCard[], remaining: string[], newDiscard: string[], reshuffled: boolean, overflowCount: number } => {
  const drawn: GameCard[] = [];
  const overflow: string[] = []; // Cards that exceed hand limit
  let remaining = [...deck];
  let currentDiscard = [...discardPile];
  let reshuffled = false;
  
  for (let i = 0; i < count; i++) {
    // Check if deck is empty before drawing
    if (remaining.length === 0) {
      // Attempt reshuffle from discard pile
      const reshuffleResult = reshuffle(currentDiscard);
      if (reshuffleResult.newDeck.length > 0) {
        remaining = reshuffleResult.newDeck;
        currentDiscard = [];
        reshuffled = true;
      } else {
        // No cards available, stop drawing
        break;
      }
    }

    // Draw one card
    if (remaining.length > 0) {
      const cardId = remaining.shift()!;
      const card = CARD_DATA[cardId];
      if (card) {
        // Check hand size limit
        if (currentHandSize + drawn.length >= MAX_HAND_SIZE) {
          // Hand is full, card goes directly to discard pile
          overflow.push(cardId);
          currentDiscard.push(cardId);
        } else {
          // Add unique ID to avoid React confusion with already played cards
          const uniqueCard = { ...card, uniqueId: cardId + '_' + Math.random().toString(36).substring(2, 9) };
          drawn.push(uniqueCard as GameCard);
        }
      }
    }
  }
  
  return { drawn, remaining, newDiscard: currentDiscard, reshuffled, overflowCount: overflow.length };
};

// Draw single card with auto-reshuffle from discard pile and hand limit check
const drawCard = (state: BattleState): { card: GameCard | null, newState: BattleState, reshuffled: boolean, handFull: boolean } => {
  let currentDeck = [...state.deck];
  let currentDiscard = [...state.discardPile];
  let reshuffled = false;

  // Check if hand is already full
  if (state.hand.length >= MAX_HAND_SIZE) {
    return { card: null, newState: state, reshuffled: false, handFull: true };
  }

  // If deck is empty, reshuffle discard pile into deck
  if (currentDeck.length === 0 && currentDiscard.length > 0) {
    const reshuffleResult = reshuffle(currentDiscard);
    if (reshuffleResult.newDeck.length > 0) {
      currentDeck = reshuffleResult.newDeck;
      currentDiscard = [];
      reshuffled = true;
    }
  }

  // Draw one card
  if (currentDeck.length > 0) {
    const cardId = currentDeck.shift()!;
    const card = CARD_DATA[cardId];
    
    // Check if adding this card would exceed hand limit
    if (state.hand.length >= MAX_HAND_SIZE) {
      // Hand is full, card goes directly to discard pile
      currentDiscard.push(cardId);
      return {
        card: null,
        newState: {
          ...state,
          deck: currentDeck,
          discardPile: currentDiscard,
          feedbackMessage: "⚠️ Mano piena! Carta scartata automaticamente."
        },
        reshuffled,
        handFull: true
      };
    }
    
    // Add unique ID to avoid React confusion
    const uniqueCard = card ? { ...card, uniqueId: cardId + '_' + Math.random().toString(36).substring(2, 9) } : null;
    return {
      card: uniqueCard as GameCard | null,
      newState: {
        ...state,
        deck: currentDeck,
        discardPile: currentDiscard,
        feedbackMessage: reshuffled ? "♻️ Mazzo rimescolato!" : state.feedbackMessage
      },
      reshuffled,
      handFull: false
    };
  }

  return { card: null, newState: state, reshuffled: false, handFull: false };
};

const detectCombos = (hand: GameCard[]): Map<string, number> => {
  const symbolCount = new Map<string, number>();
  hand.forEach(card => {
    if (card.comboSymbol) {
      const count = symbolCount.get(card.comboSymbol) || 0;
      symbolCount.set(card.comboSymbol, count + 1);
    }
  });
  return symbolCount;
};

const nodes: Node[] = [
  { id: 1, type: "Start", label: "Partenza", x: 80, y: 300, connections: [2, 3] },
  { id: 2, type: "Combat", label: "Avanguardia", x: 200, y: 210, connections: [4, 5] },
  { id: 3, type: "Resource", label: "Cassa Abbandonata", x: 200, y: 390, connections: [5, 6] },
  { id: 4, type: "Event", label: "Eco della Caverna", x: 340, y: 170, connections: [7] },
  { id: 5, type: "Combat", label: "Patuglia Goblin", x: 340, y: 300, connections: [7, 8] },
  { id: 6, type: "Rest", label: "Riposo Sicuro", x: 340, y: 440, connections: [8, 9] },
  { id: 7, type: "Combat", label: "Guardia Scudo", x: 480, y: 210, connections: [10, 11] },
  { id: 8, type: "Event", label: "Trappola Runica", x: 480, y: 320, connections: [11, 12] },
  { id: 9, type: "Resource", label: "Minerali Grezzi", x: 480, y: 470, connections: [12] },
  { id: 10, type: "Combat", label: "Campione", x: 620, y: 170, connections: [13, 14] },
  { id: 11, type: "Combat", label: "Doppia Lama", x: 620, y: 300, connections: [14, 15] },
  { id: 12, type: "Rest", label: "Focolare", x: 620, y: 470, connections: [15, 16] },
  { id: 13, type: "Event", label: "Sussurri", x: 760, y: 150, connections: [17] },
  { id: 14, type: "Resource", label: "Zaino del Minatore", x: 760, y: 270, connections: [17, 18] },
  { id: 15, type: "Combat", label: "Sentinella", x: 760, y: 380, connections: [18, 19] },
  { id: 16, type: "Event", label: "Reliquia", x: 760, y: 520, connections: [19] },
  { id: 17, type: "Combat", label: "Mietitore", x: 900, y: 230, connections: [20, 21] },
  { id: 18, type: "Rest", label: "Rifugio", x: 900, y: 340, connections: [21] },
  { id: 19, type: "Combat", label: "Avanguardia Elite", x: 900, y: 500, connections: [21] },
  { id: 20, type: "Event", label: "Vena d'Oro", x: 1040, y: 200, connections: [22] },
  { id: 21, type: "Combat", label: "Scorta Finale", x: 1040, y: 380, connections: [22] },
  { id: 22, type: "Boss", label: "Re dei Goblin", x: 1180, y: 300, connections: [] },
];

const MAP_WIDTH = 1280;
const MAP_HEIGHT = 640;

const nodeMap = new Map(nodes.map((n) => [n.id, n] as const));

const STORAGE_KEY = "soloMapProgress_v1";

const TacticalScreen = () => {
  const { selectedHero } = useHero();
  const [, setLocation] = useLocation();
  const [currentNode, setCurrentNode] = useState<number>(1);
  const [visited, setVisited] = useState<Set<number>>(new Set([1]));
  const [logs, setLogs] = useState<string[]>(["Partenza: scegli un ramo."]);
  const [battleNode, setBattleNode] = useState<Node | null>(null);
  const [battle, setBattle] = useState<BattleState | null>(null);
  const [bossDefeated, setBossDefeated] = useState(false);
  const [selectedCard, setSelectedCard] = useState<GameCard | null>(null);
  const [mulliganMode, setMulliganMode] = useState(false);
  const [mulliganSelected, setMulliganSelected] = useState<GameCard[]>([]);
  const [showReshuffleMsg, setShowReshuffleMsg] = useState(false);

  // Load progress on mount (localStorage first, then sync with DB when selectedHero is ready)
  useEffect(() => {
    try {
      console.log('🔍 Initial load: checking localStorage...');
      console.log('📋 STORAGE_KEY:', STORAGE_KEY);
      console.log('📋 localStorage keys:', Object.keys(localStorage));
      
      const raw = localStorage.getItem(STORAGE_KEY);
        console.log('📋 localStorage.getItem result:', raw);
      
      if (raw) {
        const saved = JSON.parse(raw);
        console.log('📦 Progress loaded from localStorage:', saved);
        if (typeof saved.currentNode === "number") setCurrentNode(saved.currentNode);
        if (Array.isArray(saved.visited)) setVisited(new Set<number>(saved.visited));
        if (Array.isArray(saved.logs)) setLogs(saved.logs);
        if (typeof saved.bossDefeated === "boolean") setBossDefeated(saved.bossDefeated);
      } else {
        console.log('ℹ️ No saved progress in localStorage, starting fresh');
      }
    } catch (err) {
      console.error('❌ Error loading from localStorage:', err);
    }
  }, []);

  // Sync with DB when selectedHero becomes available
  useEffect(() => {
    if (!selectedHero) {
      console.log('⏳ selectedHero not yet available, skipping DB sync');
      return;
    }

    console.log('🔄 selectedHero available, syncing with DB:', selectedHero);
    (async () => {
      try {
        const db = await loadSoloProgress(selectedHero);
        if (db) {
          console.log('✅ Progress found in DB:', db);
          setCurrentNode(db.currentNode);
          setVisited(new Set<number>(db.visited || [1]));
          setLogs(db.logs?.length ? db.logs : ["Progresso caricato dal database."]);
          setBossDefeated(!!db.bossDefeated);
        } else {
          console.log('ℹ️ No progress in DB yet, keeping localStorage state');
        }
      } catch (err) {
        console.error('❌ Error syncing with DB:', err);
      }
    })();
  }, [selectedHero]);

  // Persist progress on change (both DB and local with consistency check)
  useEffect(() => {
    try {
      const data = {
        currentNode,
        visited: Array.from(visited),
        logs,
        bossDefeated,
      };
      
      // Always save to localStorage immediately
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      console.log('💾 Saved to localStorage:', { 
        node: data.currentNode, 
        visitedCount: data.visited.length,
        logsCount: data.logs.length 
      });
      
      // Verify localStorage was actually saved
      const verify = localStorage.getItem(STORAGE_KEY);
      if (verify) {
        const parsed = JSON.parse(verify);
        console.log('✔️ Verified localStorage save:', { 
          node: parsed.currentNode === data.currentNode ? '✓' : '✗',
          visited: parsed.visited?.length === data.visited.length ? '✓' : '✗'
        });
      }
      
      if (selectedHero) {
        // Best-effort save to DB; heroClass unknown here, store placeholder
        console.log('🔄 Attempting DB save for hero:', selectedHero);
        saveSoloProgress(selectedHero, 'Unknown', data).then(() => {
          console.log('✅ Progress saved to DB successfully');
        }).catch(err => {
          console.warn('⚠️ DB save failed (will use localStorage fallback):', err?.message);
        });
      } else {
        console.log('ℹ️ selectedHero not available, DB save skipped');
      }
    } catch (err) {
      console.error('❌ Error saving progress:', err);
    }
  }, [currentNode, visited, logs, bossDefeated, selectedHero]);

  const neighbors = useMemo(() => {
    const node = nodeMap.get(currentNode);
    return node ? node.connections : [];
  }, [currentNode]);

  const appendLog = (text: string) => {
    setLogs((prev) => [...prev.slice(-9), text]);
  };

  const rollBonus = (state: BattleState): BattleState => {
    const roll = Math.floor(Math.random() * 6) + 1;
    let pa = state.pa;
    let dmgMul = state.damageMultiplier;
    let turnBonus = "";

    if (roll === 1) {
      pa = Math.max(0, pa - 1);
      turnBonus = "d6=1: -1 PA";
    } else if (roll === 4) {
      pa += 1;
      turnBonus = "d6=4: +1 PA";
    } else if (roll === 5) {
      dmgMul = 1.5;
      turnBonus = "d6=5: x1.5 danno";
    } else if (roll === 6) {
      turnBonus = "d6=6: +2 HP";
      state.playerHp = Math.min(14, state.playerHp + 2);
    } else {
      turnBonus = `d6=${roll}: nessun bonus`;
    }

    return { ...state, pa, damageMultiplier: dmgMul, turnBonus };
  };

  const startBattle = (node: Node) => {
    const heroProfile = HERO_PROFILES[selectedHero as HeroName];
    const initialDeck = heroProfile ? shuffleDeck([...heroProfile.initialDeck]) : [];
    const { drawn, remaining, newDiscard, reshuffled, overflowCount } = drawCards(initialDeck, 3, [], 0);
    
    // Trigger reshuffle toast if needed
    if (reshuffled) {
      setShowReshuffleMsg(true);
      setTimeout(() => setShowReshuffleMsg(false), 2000);
    }
    
    const base: BattleState = {
      enemyHp: node.type === "Boss" ? 26 : 14,
      playerHp: battle?.playerHp ?? 12,
      playerShield: 0,
      baseDamage: node.type === "Boss" ? 5 : 4,
      pa: 3,
      turnBonus: "",
      damageMultiplier: 1,
      hand: drawn,
      deck: remaining,
      discardPile: newDiscard,
      feedbackMessage: overflowCount > 0 
        ? `⚠️ Mano piena! ${overflowCount} carte scartate.`
        : reshuffled ? "♻️ Mazzo rimescolato! Hai pescato 3 carte" : "Hai pescato 3 carte",
    };
    const rolled = rollBonus(base);
    setBattleNode(node);
    setBattle(rolled);
    appendLog(`Battaglia iniziata contro ${node.label} (PA turno: ${rolled.pa})`);
  };

  const useCard = (card: GameCard) => {
    if (!battle || battle.pa < card.paCost) return;
    
    // Check if we're trying to combo with selected card
    if (selectedCard && selectedCard.comboSymbol && card.comboSymbol && selectedCard.comboSymbol === card.comboSymbol && selectedCard !== card) {
      // Check if this is a signature combo (different IDs) or common combo (same ID)
      if (selectedHero && isSignatureCombo(selectedHero as HeroName, selectedCard.id, card.id)) {
        executeCombo(selectedCard, card, true); // Signature combo
      } else {
        executeCombo(selectedCard, card, false); // Common combo
      }
      setSelectedCard(null);
      return;
    }
    
    // Check if there are other cards with same symbol for potential combo
    const matchingCards = battle.hand.filter(c => c.comboSymbol && card.comboSymbol && c.comboSymbol === card.comboSymbol && c !== card);
    
    if (matchingCards.length > 0 && card.comboSymbol) {
      // Select this card and highlight compatible ones
      setSelectedCard(card);
      setBattle({ ...battle, feedbackMessage: `Seleziona un'altra carta ${COMBO_SYMBOL_EMOJI[card.comboSymbol]} per attivare combo!` });
      return;
    }
    
    // Play single card normally
    playSingleCard(card);
  };

  const playSingleCard = (card: GameCard) => {
    if (!battle) return;
    
    // Remove card from hand
    const newHand = battle.hand.filter(c => c !== card);
    const next = { ...battle, hand: newHand, discardPile: [...battle.discardPile, card.id] };
    next.pa -= card.paCost;

    const value = card.value || 0;

    if (card.type === "Attack") {
      const dmg = Math.round(value * battle.damageMultiplier);
      next.enemyHp = Math.max(0, next.enemyHp - dmg);
      appendLog(`${card.name}: -${dmg} HP al nemico`);
    } else if (card.type === "Defense") {
      next.playerShield += value;
      appendLog(`${card.name}: +${value} Scudo`);
    } else if (card.type === "Heal") {
      next.playerHp = Math.min(14, next.playerHp + value);
      appendLog(`${card.name}: +${value} HP`);
    }

    next.feedbackMessage = "";
    setBattle(next);
  };

  const mulliganCards = (cardsToDiscard: GameCard[]) => {
    if (!battle || cardsToDiscard.length === 0 || cardsToDiscard.length > 2) return;

    // Remove selected cards from hand and add to discard pile
    const newHand = battle.hand.filter(c => !cardsToDiscard.includes(c));
    let updatedState: BattleState = {
      ...battle,
      hand: newHand,
      discardPile: [...battle.discardPile, ...cardsToDiscard.map(c => c.id)]
    };
    
    let anyReshuffled = false;
    let handFullCount = 0;

    // Draw same number of cards as discarded
    for (let i = 0; i < cardsToDiscard.length; i++) {
      const result = drawCard(updatedState);
      if (result.reshuffled) anyReshuffled = true;
      if (result.handFull) handFullCount++;
      if (result.card) {
        updatedState = {
          ...result.newState,
          hand: [...result.newState.hand, result.card]
        };
      } else {
        updatedState = result.newState;
      }
    }
    
    if (anyReshuffled) {
      appendLog("♻️ MAZZO RIMESCOLATO dalla pila degli scarti!");
    }
    if (handFullCount > 0) {
      appendLog(`⚠️ Mano piena! ${handFullCount} carte scartate automaticamente.`);
    }

    appendLog(`🔄 Riciclate ${cardsToDiscard.length} carte, pescate ${cardsToDiscard.length - handFullCount} nuove`);
    updatedState.feedbackMessage = `🔄 ${cardsToDiscard.length} carte riciclate`;
    setBattle(updatedState);
  };

  const executeCombo = (card1: GameCard, card2: GameCard, isSignature: boolean) => {
    if (!battle || !selectedHero) return;

    // Remove both cards from hand
    const newHand = battle.hand.filter(c => c !== card1 && c !== card2);
    const next = { ...battle, hand: newHand, discardPile: [...battle.discardPile, card1.id, card2.id] };
    
    // Combo costs: signature combo costs only 1 PA (special reward), common combos cost min of both
    next.pa -= isSignature ? 1 : Math.min(card1.paCost, card2.paCost);

    // Calculate combo effect: for signature combos, multiply by 2.5; for regular, add 2 bonus
    let comboValue: number;
    if (isSignature) {
      comboValue = Math.round(((card1.value || 0) + (card2.value || 0)) * 2.5);
    } else {
      comboValue = (card1.value || 0) + (card2.value || 0) + 2;
    }
    
    const symbol = card1.comboSymbol ? COMBO_SYMBOL_EMOJI[card1.comboSymbol] : '✨';

    if (card1.type === "Attack" || card2.type === "Attack") {
      const dmg = Math.round(comboValue * battle.damageMultiplier);
      next.enemyHp = Math.max(0, next.enemyHp - dmg);
      if (isSignature) {
        appendLog(`⭐ MOSSA SPECIALE ${symbol}: -${dmg} HP al nemico! [x2.5]`);
      } else {
        appendLog(`🔥 COMBO ${symbol}: -${dmg} HP al nemico!`);
      }
    } else if (card1.type === "Defense" || card2.type === "Defense") {
      next.playerShield += comboValue;
      if (isSignature) {
        appendLog(`⭐ MOSSA SPECIALE ${symbol}: +${comboValue} Scudo! [x2.5]`);
      } else {
        appendLog(`🔥 COMBO ${symbol}: +${comboValue} Scudo!`);
      }
    } else if (card1.type === "Heal" || card2.type === "Heal") {
      next.playerHp = Math.min(14, next.playerHp + comboValue);
      if (isSignature) {
        appendLog(`⭐ MOSSA SPECIALE ${symbol}: +${comboValue} HP! [x2.5]`);
      } else {
        appendLog(`🔥 COMBO ${symbol}: +${comboValue} HP!`);
      }
    }

    next.feedbackMessage = isSignature ? `⭐ Mossa Speciale ${symbol} [x2.5]` : `🔥 Combo ${symbol} [+2 Bonus]`;
    
    // Log signature combo with hero-specific name
    if (isSignature && selectedHero) {
      const comboName = HERO_COMBO_NAMES[selectedHero as HeroName] || 'COMBO SPECIALE';
      setTimeout(() => {
        appendLog(`🌟 ${comboName}! 🌟`);
      }, 100);
    }
    
    setBattle(next);
  };

  const endTurn = () => {
    if (!battle || !battleNode) return;

    // Clear selected card on turn end
    setSelectedCard(null);

    let nextHp = battle.playerHp;
    if (battle.enemyHp > 0) {
      const incoming = battle.baseDamage;
      const mitigated = Math.max(0, incoming - battle.playerShield);
      nextHp = Math.max(0, nextHp - mitigated);
      appendLog(`Il nemico colpisce: -${mitigated} HP (scudo ${battle.playerShield})`);
    }

    if (battle.enemyHp <= 0) {
      finishBattle(true, battleNode);
      return;
    }

    if (nextHp <= 0) {
      finishBattle(false, battleNode);
      return;
    }

    // ========== DECK MANAGEMENT SYSTEM ==========
    // Step 1: Sposta le carte rimaste in mano nella pila degli scarti
    const remainingHandIds = battle.hand.map(c => c.id);
    const updatedDiscardPile = [...battle.discardPile, ...remainingHandIds];

    // Step 2-3: Pesca nuova mano (drawCards gestisce auto-reshuffle con Fisher-Yates)
    // Se deck < 3 carte, drawCards rimescola automaticamente gli scarti nel mazzo
    // Pass 0 for currentHandSize since we just discarded all cards
    const { drawn, remaining, newDiscard, reshuffled, overflowCount } = drawCards(battle.deck, 3, updatedDiscardPile, 0);
    
    // Step 4: Trigger reshuffle toast and log
    if (reshuffled) {
      setShowReshuffleMsg(true);
      setTimeout(() => setShowReshuffleMsg(false), 2000);
      appendLog("♻️ Mazzo rimescolato dalla pila degli scarti!");
    }
    if (overflowCount > 0) {
      appendLog(`⚠️ ${overflowCount} carte scartate per limite mano (max ${MAX_HAND_SIZE})`);
    }

    // Step 5: Aggiorna tutti gli stati in un colpo solo
    const refreshed: BattleState = {
      enemyHp: battle.enemyHp,
      playerHp: nextHp,
      playerShield: 0,
      baseDamage: battle.baseDamage,
      pa: 3, // Reset Punti Azione per nuovo turno
      turnBonus: "",
      damageMultiplier: 1,
      hand: drawn,
      deck: remaining,
      discardPile: newDiscard,
      feedbackMessage: overflowCount > 0 
        ? `⚠️ Pescate ${drawn.length} carte (${overflowCount} scartate per limite)` 
        : drawn.length < 3 ? `⚠️ Pescate solo ${drawn.length} carte (mazzo esaurito)` : "Hai pescato 3 carte",
    };
    const rolled = rollBonus(refreshed);
    setBattle(rolled);
  };

  const finishBattle = async (victory: boolean, node: Node) => {
    if (!victory) {
      appendLog("Sconfitto. Riprova dal nodo corrente.");
      setBattleNode(null);
      setBattle(null);
      return;
    }

    appendLog(`Vittoria su ${node.label}.`);
    const updated = new Set(visited);
    updated.add(node.id);
    setVisited(updated);
    setCurrentNode(node.id);
    setBattleNode(null);
    setBattle(null);

    if (node.id === 22) {
      setBossDefeated(true);
      await updateSupabaseProgress();
    }
  };

  const handleNodeClick = (node: Node) => {
    const reachable = neighbors.includes(node.id) || node.id === currentNode || visited.has(node.id);
    if (!reachable) return;

    // Se già visitato, non attivare più gli effetti
    const alreadyVisited = visited.has(node.id);
    if (alreadyVisited) return;

    if (node.type === "Combat" || node.type === "Boss") {
      startBattle(node);
      return;
    }

    if (node.type === "Resource") {
      appendLog(`${node.label}: risorse raccolte.`);
    }

    if (node.type === "Event") {
      const roll = Math.floor(Math.random() * 6) + 1;
      appendLog(`${node.label}: evento d6=${roll}.`);
    }

    if (node.type === "Rest" || node.type === "Start") {
      appendLog(`${node.label}: ti riposi (+2 HP).`);
      setBattle((prev) => (prev ? { ...prev, playerHp: Math.min(14, prev.playerHp + 2) } : null));
    }

    const updated = new Set(visited);
    updated.add(node.id);
    setVisited(updated);
    setCurrentNode(node.id);
  };

  const updateSupabaseProgress = async () => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !key) {
      appendLog("Supabase non configurato.");
      return;
    }

    try {
      await fetch(`${url}/rest/v1/progress?user_id=eq.1`, {
        method: "PATCH",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ mine_unlocked: true, goblin_defeated: true }),
      });
      appendLog("Supabase: mine_unlocked e goblin_defeated impostati");
    } catch (err) {
      console.error("Supabase error", err);
      appendLog("Supabase non raggiungibile per l'aggiornamento");
    }
  };

  const getNodeColor = (node: Node) => {
    if (visited.has(node.id)) return "#22c55e";
    switch (node.type) {
      case "Combat":
        return "#ef4444"; // Rosso acceso
      case "Resource":
        return "#a855f7"; // Viola
      case "Event":
        return "#f59e0b"; // Arancione
      case "Rest":
        return "#22c55e"; // Verde
      case "Boss":
        return "#1f2937"; // Nero/Grigio scuro
      case "Start":
        return "#06b6d4"; // Ciano
      default:
        return "#64748b";
    }
  };

  const getNodeGlowColor = (node: Node) => {
    switch (node.type) {
      case "Combat":
        return "rgba(239, 68, 68, 0.6)";
      case "Resource":
        return "rgba(168, 85, 247, 0.6)";
      case "Event":
        return "rgba(245, 158, 11, 0.6)";
      case "Rest":
        return "rgba(34, 197, 94, 0.6)";
      case "Boss":
        return "rgba(31, 41, 55, 0.8)";
      case "Start":
        return "rgba(6, 182, 212, 0.6)";
      default:
        return "rgba(100, 116, 139, 0.6)";
    }
  };

  const iconFor = (type: NodeType) => {
    switch (type) {
      case "Combat":
        return "⚔️";
      case "Resource":
        return "💎";
      case "Event":
        return "✨";
      case "Rest":
        return "⛺";
      case "Boss":
        return "💀";
      case "Start":
        return "🚪";
      default:
        return "●";
    }
  };

  const isReachable = (node: Node) => neighbors.includes(node.id) || node.id === currentNode || visited.has(node.id);
  // If no hero selected, redirect to hero selection
  if (!selectedHero) {
    console.log(' TacticalScreen: No selectedHero, redirecting to hero-selection');
    setLocation('/hero-selection');
    return <div className="min-h-screen bg-black flex items-center justify-center text-white">Caricamento...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white relative overflow-hidden">
      {/* Reshuffle Toast Message */}
      {showReshuffleMsg && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none animate-in fade-in zoom-in duration-300">
          <div className="bg-black/60 backdrop-blur-md px-12 py-8 rounded-xl border-2 border-yellow-400 shadow-2xl">
            <p className="text-6xl font-black italic text-yellow-400 drop-shadow-2xl animate-pulse">
              ♻️ MAZZO RIMESCOLATO ♻️
            </p>
          </div>
        </div>
      )}
      
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, rgba(14,165,233,0.18), transparent 35%), radial-gradient(circle at 80% 40%, rgba(236,72,153,0.14), transparent 40%), radial-gradient(circle at 50% 80%, rgba(52,211,153,0.12), transparent 40%)",
        }}
      />

      <div className="relative max-w-6xl mx-auto py-8 px-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/80">Caverna Goblin</p>
            <h1 className="text-3xl font-black">Mappa Tattica 22 nodi</h1>
            <p className="text-slate-400 text-sm">
              Almeno tre bivi con ricongiungimenti. Se sconfiggi il Boss, sblocco phygital su Supabase.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {bossDefeated && (
              <span className="px-3 py-2 rounded-full bg-emerald-500/20 text-emerald-300 text-sm border border-emerald-400/40 text-center">
                Boss sconfitto • Progress salvato
              </span>
            )}
            <button
              onClick={() => {
                // Reset dungeon progress when returning home
                localStorage.removeItem(STORAGE_KEY);
                setCurrentNode(1);
                setVisited(new Set([1]));
                setLogs(["Partenza: scegli un ramo."]);
                setBattleNode(null);
                setBattle(null);
                setBossDefeated(false);
                setSelectedCard(null);
                setLocation('/home');
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#1e40af',
                color: 'white',
                border: '1px solid #3b82f6',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 'bold',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1d3a8a';
                e.currentTarget.style.boxShadow = '0 0 10px rgba(59, 130, 246, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#1e40af';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              🏠 Torna a Casa
            </button>
          </div>
        </div>

        <div className="relative h-[640px] overflow-hidden" style={{
          backgroundImage: 'url(/assets/sfondo%20mappa%20nodi.png)',
          backgroundSize: '120%',
          backgroundPosition: '55% 50%'
        }}>
          <style>{`
            @keyframes pulse-node {
              0%, 100% { box-shadow: 0 0 10px 2px currentColor; }
              50% { box-shadow: 0 0 20px 4px currentColor; }
            }
            .pulse-node { animation: pulse-node 2s ease-in-out infinite; }
          `}</style>
          <svg className="absolute inset-0" width="100%" height="100%" viewBox="0 0 1280 640">
            {nodes.flatMap((node) =>
              node.connections.map((target) => {
                const to = nodeMap.get(target);
                if (!to) return null;
                const active = visited.has(node.id) && (isReachable(to) || visited.has(to.id));
                return (
                  <line
                    key={`${node.id}-${target}`}
                    x1={node.x}
                    y1={node.y}
                    x2={to.x}
                    y2={to.y}
                    stroke="#000000"
                    strokeWidth={active ? 2.5 : 1.5}
                    strokeOpacity={active ? 0.9 : 0.5}
                    strokeDasharray={active ? "" : "4 4"}
                  />
                );
              })
            )}
          </svg>

          {nodes.map((node) => {
            const reachable = isReachable(node);
            const color = getNodeColor(node);
            const glowColor = getNodeGlowColor(node);
            const isAlreadyVisited = visited.has(node.id);
            const canClick = reachable && (!isAlreadyVisited || node.type === "Combat" || node.type === "Boss");
            return (
              <button
                key={node.id}
                onClick={() => handleNodeClick(node)}
                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-all ${reachable ? "pulse-node" : ""}`}
                style={{
                  left: `${(node.x / MAP_WIDTH) * 100}%`,
                  top: `${(node.y / MAP_HEIGHT) * 100}%`,
                  width: 82,
                  height: 82,
                  background: reachable ? color : "#0f172a",
                  opacity: reachable ? 1 : 0.4,
                  border: `2px solid ${visited.has(node.id) ? "#22c55e" : color}`,
                  boxShadow: reachable ? `0 0 15px 2px ${glowColor}, inset 0 0 10px ${glowColor}` : "none",
                  cursor: canClick ? "pointer" : "not-allowed",
                  transform: reachable ? "translate(-50%, -50%)" : "translate(-50%, -50%) scale(0.88)",
                }}
                disabled={!canClick}
              >
                <div className="flex flex-col items-center justify-center text-center px-1">
                  <span className="text-3xl drop-shadow-lg">{iconFor(node.type)}</span>
                  <span className="text-[8px] font-bold uppercase leading-2 text-white/80">N{node.id}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-2 bg-white/5 border border-white/10 rounded-xl p-4">
            <h3 className="text-sm text-slate-200 font-semibold mb-2">Registro</h3>
            <div className="space-y-1 text-xs text-slate-200 max-h-48 overflow-auto pr-2">
              {logs.map((line, idx) => (
                <p key={idx} className="font-mono">
                  • {line}
                </p>
              ))}
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm space-y-2">
            <p className="text-slate-300">Regole battaglia: 3 PA/turno, lancia d6 per bonus all'inizio del turno.</p>
            <p className="text-slate-300">Carte base (8): 4 attacchi, 2 difese, 2 cure.</p>
            <p className="text-slate-300">Tre bivi principali con ricongiungimenti visibili sulle connessioni.</p>
          </div>
        </div>
      </div>

      {battleNode && battle && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-40">
          {/* Giant Combo Text Overlay - Dynamic for all heroes */}
          {battle.feedbackMessage?.includes('Mossa Speciale') && selectedHero && (() => {
            const heroProfile = HERO_PROFILES[selectedHero as HeroName];
            const comboName = HERO_COMBO_NAMES[selectedHero as HeroName] || 'COMBO SPECIALE';
            const classColors = CLASS_GLOW_COLORS[heroProfile.class];
            
            return (
              <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
                <style>{`
                  @keyframes comboBounce {
                    0%, 100% { transform: scale(0.8); opacity: 0; }
                    50% { transform: scale(1.2); opacity: 1; }
                  }
                `}</style>
                <div style={{ animation: 'comboBounce 1s ease-in-out' }}>
                  <h1 className="text-9xl font-black text-center" 
                    style={{
                      color: classColors.primary,
                      textShadow: `0 0 40px ${classColors.shadow}, 0 0 80px ${classColors.shadow}, 0 0 120px ${classColors.shadow}`,
                      lineHeight: '1'
                    }}>
                    COMBO!
                  </h1>
                  <p className="text-6xl font-black text-center mt-4 drop-shadow-2xl" 
                    style={{
                      color: classColors.primary,
                      textShadow: `0 0 20px ${classColors.shadow}, 0 0 40px ${classColors.shadow}`
                    }}>
                    {comboName}
                  </p>
                </div>
              </div>
            );
          })()}
          
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">Battaglia</p>
                <h2 className="text-2xl font-black" style={{ color: getNodeColor(battleNode) }}>{battleNode.label}</h2>
                <p className="text-slate-400 text-xs">PA turno: {battle.pa} • {battle.turnBonus}</p>
                {battle.feedbackMessage && (
                  <p className="text-amber-300 text-sm font-semibold mt-1 animate-pulse">
                    ✨ {battle.feedbackMessage}
                  </p>
                )}
              </div>
              <button
                className="px-3 py-2 text-sm rounded-md bg-white/10 border border-white/20"
                onClick={() => {
                  setBattleNode(null);
                  setBattle(null);
                }}
              >
                Chiudi
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                <p className="text-xs text-slate-400">Nemico</p>
                <p className="text-xl font-bold text-rose-300">HP {battle.enemyHp}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                <p className="text-xs text-slate-400">Operativo</p>
                <p className="text-xl font-bold text-emerald-300">HP {battle.playerHp}</p>
                <p className="text-xs text-slate-300">Scudo {battle.playerShield}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                <p className="text-xs text-slate-400">PA rimasti</p>
                <p className="text-xl font-bold text-amber-300">{battle.pa}</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm text-slate-200 font-semibold mb-3 flex items-center justify-between">
                <span>Mano ({battle.hand.length} carte • Deck: {battle.deck.length} • Scarti: {battle.discardPile.length})</span>
                {!mulliganMode && (
                  <button
                    onClick={() => {
                      setMulliganMode(true);
                      setMulliganSelected([]);
                    }}
                    className="px-3 py-1 text-xs rounded-md bg-purple-600 hover:bg-purple-700 border border-purple-400 transition-colors"
                    disabled={battle.hand.length === 0}
                  >
                    🔄 RICICLA (max 2)
                  </button>
                )}
                {mulliganMode && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        mulliganCards(mulliganSelected);
                        setMulliganMode(false);
                        setMulliganSelected([]);
                      }}
                      className="px-3 py-1 text-xs rounded-md bg-green-600 hover:bg-green-700 border border-green-400 transition-colors"
                      disabled={mulliganSelected.length === 0}
                    >
                      ✔ CONFERMA ({mulliganSelected.length})
                    </button>
                    <button
                      onClick={() => {
                        setMulliganMode(false);
                        setMulliganSelected([]);
                      }}
                      className="px-3 py-1 text-xs rounded-md bg-red-600 hover:bg-red-700 border border-red-400 transition-colors"
                    >
                      ✖ ANNULLA
                    </button>
                  </div>
                )}
              </h4>
              <div className="flex gap-3 items-center justify-center flex-wrap">
                {battle.hand.map((card, idx) => {
                  const canPlay = battle.pa >= card.paCost;
                  const isSelected = selectedCard === card;
                  const isMulliganSelected = mulliganSelected.includes(card);
                  
                  // Check if this is a signature card
                  const isSignatureCard = selectedHero && HERO_SIGNATURE_CARDS[selectedHero as HeroName]?.includes(card.id);
                  
                  // Find the other signature card in hand (not this one)
                  const otherSignatureInHand = selectedHero && isSignatureCard ? battle.hand.find(c => 
                    HERO_SIGNATURE_CARDS[selectedHero as HeroName]?.includes(c.id) && c.id !== card.id
                  ) : null;
                  
                  // Signature pair is present only if BOTH cards are in hand
                  const isSignatureBothPresent = isSignatureCard && otherSignatureInHand !== undefined;
                  
                  // Check if this card is compatible with selected card (for combo)
                  const isCompatible = selectedCard && 
                    selectedCard !== card && 
                    isSignatureCard && 
                    selectedHero && 
                    isSignatureCombo(selectedHero as HeroName, card.id, selectedCard.id);
                  
                  const symbolStyle = card.comboSymbol ? SYMBOL_COLORS[card.comboSymbol] : null;

                  return (
                    <button
                      key={`${card.id}-${idx}`}
                      disabled={!canPlay && !mulliganMode}
                      onClick={() => {
                        if (mulliganMode) {
                          // Toggle mulligan selection
                          if (isMulliganSelected) {
                            setMulliganSelected(mulliganSelected.filter(c => c !== card));
                          } else if (mulliganSelected.length < 2) {
                            setMulliganSelected([...mulliganSelected, card]);
                          }
                        } else {
                          useCard(card);
                        }
                      }}
                      className={cn(
                        "relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 text-left transition-all duration-300",
                        "w-[150px] h-[220px] flex-shrink-0",
                        canPlay && !mulliganMode ? "hover:scale-105 cursor-pointer" : mulliganMode ? "cursor-pointer hover:scale-105" : "opacity-40 cursor-not-allowed",
                        isSelected && !mulliganMode && "ring-4 ring-white scale-105",
                        isMulliganSelected && "ring-4 ring-purple-500 scale-105"
                      )}
                      style={{ 
                        borderWidth: '3px',
                        borderColor: isSelected ? '#fff' : isSignatureBothPresent ? 'rgba(251,191,36,0.6)' : 'rgba(255,255,255,0.15)',
                        boxShadow: isSignatureBothPresent ? '0 0 30px rgba(251,191,36,0.8)' : (isCompatible && symbolStyle) ? symbolStyle.shadow : 'none'
                      }}
                    >
                      {/* PA Cost Badge */}
                      <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-amber-500 border-3 border-amber-300 flex items-center justify-center shadow-xl z-10">
                        <span className="text-black font-black text-base">{card.paCost}</span>
                      </div>

                      {/* Combo/Signature Symbol (Large, Top) - Show only if card has symbol */}
                      <div className="text-center mb-2">
                        {card.comboSymbol && (
                          <>
                            <span className={cn(
                              "text-5xl drop-shadow-lg transition-all duration-300",
                              isSignatureBothPresent ? "opacity-100 animate-pulse" : "opacity-30 grayscale"
                            )}>
                              {COMBO_SYMBOL_EMOJI[card.comboSymbol]}
                            </span>
                            {isSignatureBothPresent && (
                              <div className="text-xs text-amber-300 font-bold mt-1 animate-pulse">⚡ Pronta!</div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Card Content */}
                      <div className="flex flex-col items-center text-center space-y-1">
                        <p className="text-xs font-bold text-white uppercase tracking-wider">{card.name}</p>
                        <div className="flex items-baseline gap-1">
                          <p className="text-3xl font-black text-cyan-300">{card.value}</p>
                          <p className="text-xs text-slate-400">{card.type}</p>
                        </div>
                        
                        {/* Show Special badge ONLY for signature pair - positioned absolute */}
                        {isSignatureBothPresent && (
                          <div className="absolute -top-2 -right-2 px-2 py-1 bg-amber-500/30 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.6)] animate-pulse border border-amber-400/40 z-20">
                            <span className="text-amber-200 text-[10px] font-bold uppercase">⭐ Combo!</span>
                          </div>
                        )}
                        
                        {isSelected && !mulliganMode && (
                          <div className="mt-2 px-2 py-1 bg-white/20 rounded-full">
                            <span className="text-white text-[10px] font-bold uppercase">Selezionata</span>
                          </div>
                        )}
                        
                        {isMulliganSelected && mulliganMode && (
                          <div className="mt-2 px-2 py-1 bg-purple-500/30 rounded-full border border-purple-400">
                            <span className="text-purple-200 text-[10px] font-bold uppercase">🔄 Da Riciclare</span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">Ogni carta costa 1 PA. A fine turno il nemico attacca.</p>
              <button className="px-4 py-2 rounded-md font-semibold text-black" style={{ backgroundColor: getNodeColor(battleNode) }} onClick={endTurn}>
                Fine turno
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default TacticalScreen;

