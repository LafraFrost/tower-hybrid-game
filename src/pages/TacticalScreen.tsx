import React, { useEffect, useMemo, useState } from "react";
import { useHero } from "@/context/HeroContext";
import { loadSoloProgress, saveSoloProgress } from "@/lib/progressService";
import { useLocation } from "wouter";

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
    const base: BattleState = {
      enemyHp: node.type === "Boss" ? 26 : 14,
      playerHp: battle?.playerHp ?? 12,
      playerShield: 0,
      baseDamage: node.type === "Boss" ? 5 : 4,
      pa: 3,
      turnBonus: "",
      damageMultiplier: 1,
    };
    const rolled = rollBonus(base);
    setBattleNode(node);
    setBattle(rolled);
    appendLog(`Battaglia iniziata contro ${node.label} (PA turno: ${rolled.pa})`);
  };

  const useCard = (card: Card) => {
    if (!battle || battle.pa <= 0) return;
    const next = { ...battle, playerShield: card.kind === "defense" ? battle.playerShield + 3 : battle.playerShield };
    next.pa -= 1;

    if (card.kind === "attack") {
      const dmg = Math.round(4 * battle.damageMultiplier);
      next.enemyHp = Math.max(0, next.enemyHp - dmg);
      appendLog(`${card.name}: -${dmg} HP al nemico`);
    }

    if (card.kind === "heal") {
      next.playerHp = Math.min(14, next.playerHp + 3);
      appendLog(`${card.name}: +3 HP`);
    }

    setBattle(next);
  };

  const endTurn = () => {
    if (!battle || !battleNode) return;

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

    const refreshed: BattleState = {
      enemyHp: battle.enemyHp,
      playerHp: nextHp,
      playerShield: 0,
      baseDamage: battle.baseDamage,
      pa: 3,
      turnBonus: "",
      damageMultiplier: 1,
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
              onClick={() => setLocation('/home')}
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
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">Battaglia</p>
                <h2 className="text-2xl font-black" style={{ color: getNodeColor(battleNode) }}>{battleNode.label}</h2>
                <p className="text-slate-400 text-xs">PA turno: {battle.pa} • {battle.turnBonus}</p>
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
              <h4 className="text-sm text-slate-200 font-semibold mb-2">Mazzo base</h4>
              <div className="grid grid-cols-4 gap-2">
                {cardDeck.map((card) => (
                  <button
                    key={card.id}
                    disabled={battle.pa <= 0}
                    onClick={() => useCard(card)}
                    className="bg-white/5 border border-white/15 rounded-lg p-2 text-left hover:border-white/40 disabled:opacity-50"
                  >
                    <p className="text-xs font-semibold">{card.name}</p>
                    <p className="text-[11px] text-slate-300">{card.desc}</p>
                  </button>
                ))}
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

