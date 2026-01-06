import { useHero, GAME_DATA } from "@/context/HeroContext";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Heart, Shield, Zap, Skull, Trophy, AlertTriangle, Sword } from "lucide-react";
import { Redirect, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { NeonButton } from "@/components/NeonButton";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Enemy {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  damage: number;
  gridCoords: string;
  type: 'standard' | 'elite' | 'boss';
}

interface SessionData {
  id: number;
  currentHp: number;
  nodeCounter: number;
}

interface DamageResult {
  newHp: number;
  damage: number;
}

interface RewardResult {
  newCredits: number;
  reward: number;
}

export default function CombatScreen() {
  const { playerState, isInitialized } = useHero();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [heroHp, setHeroHp] = useState(0);
  const [combatEnded, setCombatEnded] = useState(false);
  const [victory, setVictory] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);

  // Get session and active encounter
  const sessionQuery = useQuery({
    queryKey: ['/api/hero-session', playerState?.heroName],
    enabled: !!playerState
  });

  useEffect(() => {
    if (sessionQuery.data) {
      const data = sessionQuery.data as SessionData;
      setSessionId(data.id);
      setHeroHp(data.currentHp);
      
      // Generate enemies based on difficulty
      if (enemies.length === 0) {
        const difficulty = data.nodeCounter || 1;
        const scaleFactor = 1 + (difficulty * 0.1);
        
        setEnemies([
          {
            id: 'drone_1',
            name: 'Drone',
            hp: Math.round(6 * scaleFactor),
            maxHp: Math.round(6 * scaleFactor),
            damage: Math.round(2 * scaleFactor),
            gridCoords: '4,1',
            type: 'standard'
          },
          {
            id: 'fante_1',
            name: 'Fante',
            hp: Math.round(8 * scaleFactor),
            maxHp: Math.round(8 * scaleFactor),
            damage: Math.round(3 * scaleFactor),
            gridCoords: '4,3',
            type: 'standard'
          }
        ]);
      }
    }
  }, [sessionQuery.data, enemies.length]);

  // Attack mutation
  const attackMutation = useMutation({
    mutationFn: async (enemyId: string) => {
      // Simulate attack - in real game this would be card-based
      return { damage: Math.floor(Math.random() * 5) + 3 };
    },
    onSuccess: (data, enemyId) => {
      setEnemies(prev => {
        const updated = prev.map(e => {
          if (e.id === enemyId) {
            const newHp = Math.max(0, e.hp - data.damage);
            return { ...e, hp: newHp };
          }
          return e;
        });
        
        // Check if all enemies defeated
        if (updated.every(e => e.hp <= 0)) {
          setCombatEnded(true);
          setVictory(true);
        }
        
        return updated;
      });
      
      toast({
        title: 'Attacco!',
        description: `Inflitti ${data.damage} danni!`,
      });
    }
  });

  // End turn - enemies attack
  const endTurnMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId) throw new Error('No session');
      
      // Calculate total enemy damage
      const totalDamage = enemies
        .filter(e => e.hp > 0)
        .reduce((sum, e) => sum + e.damage, 0);
      
      const res = await apiRequest('POST', `/api/hero-session/${sessionId}/damage`, { damage: totalDamage });
      const result = await res.json() as DamageResult;
      return { ...result, totalDamage };
    },
    onSuccess: (data) => {
      setHeroHp(data.newHp);
      
      if (data.newHp <= 0) {
        setCombatEnded(true);
        setVictory(false);
      } else {
        toast({
          title: 'Turno nemico',
          description: `Subiti ${data.totalDamage} danni! HP: ${data.newHp}`,
          variant: 'destructive'
        });
      }
    }
  });

  // Victory reward
  const claimRewardMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId) throw new Error('No session');
      const reward = 20 + Math.floor(Math.random() * 30);
      const res = await apiRequest('POST', `/api/hero-session/${sessionId}/reward`, { credits: reward });
      const result = await res.json() as RewardResult;
      return { ...result, reward };
    },
    onSuccess: (data) => {
      toast({
        title: 'Ricompensa!',
        description: `Guadagnati ${data.reward} crediti!`,
      });
      setLocation('/hud/tactical');
    }
  });

  const handleBack = () => {
    setLocation('/hud/tactical');
  };

  if (!isInitialized || !playerState) {
    return <Redirect to="/" />;
  }

  const { heroName, heroClass, maxHP, currentPA, currentR2, maxR2 } = playerState;
  const colors = GAME_DATA.CLASS_COLORS[heroClass];

  return (
    <div className="min-h-screen pb-4 relative overflow-hidden flex flex-col bg-gradient-to-b from-red-950/30 via-black to-black">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-500/10 via-transparent to-transparent pointer-events-none" />
      
      {/* Header */}
      <div className="relative z-20 flex items-center justify-between p-3 border-b border-red-500/30 bg-black/80 backdrop-blur">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="text-red-400 hover:text-red-300 gap-1"
          data-testid="button-back-combat"
        >
          <ChevronLeft className="w-4 h-4" />
          RITIRATA
        </Button>
        <div className="text-center">
          <h1 className="text-sm font-display text-red-400 uppercase tracking-wider flex items-center gap-2">
            <Sword className="w-4 h-4" />
            Combattimento
          </h1>
        </div>
        <div className="w-20" />
      </div>

      {/* Combat Grid */}
      <div className="flex-1 mx-3 mt-3 relative">
        {/* Grid Background */}
        <div className="w-full aspect-[6/5] bg-cyan-900/10 rounded-lg border border-cyan-500/30 relative overflow-hidden">
          {/* Grid Lines */}
          <div className="absolute inset-0 grid grid-cols-6 grid-rows-5 pointer-events-none">
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i} className="border border-cyan-500/10" />
            ))}
          </div>

          {/* Hero Unit */}
          <motion.div
            className={cn(
              "absolute w-12 h-12 rounded-full flex items-center justify-center border-2 z-20",
              colors.bg, colors.border,
              "shadow-[0_0_20px_rgba(6,182,212,0.5)]"
            )}
            style={{ left: 'calc(16.67% * 1 + 8.33% - 24px)', top: 'calc(20% * 2 + 10% - 24px)' }}
          >
            <span className={cn("text-sm font-bold", colors.text)}>{heroName.substring(0, 2)}</span>
            <div className="absolute -bottom-3 w-10 h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
              <div 
                className="h-full bg-green-500 transition-all"
                style={{ width: `${(heroHp / maxHP) * 100}%` }}
              />
            </div>
          </motion.div>

          {/* Enemy Units */}
          {enemies.map((enemy) => {
            const [gx, gy] = enemy.gridCoords.split(',').map(Number);
            const isAlive = enemy.hp > 0;
            
            return (
              <motion.div
                key={enemy.id}
                initial={{ scale: 0 }}
                animate={{ scale: isAlive ? 1 : 0.5, opacity: isAlive ? 1 : 0.3 }}
                className={cn(
                  "absolute w-10 h-10 rounded-full flex items-center justify-center border-2 z-10 cursor-pointer",
                  enemy.type === 'boss' ? "bg-fuchsia-950 border-fuchsia-500" :
                  enemy.type === 'elite' ? "bg-orange-950 border-orange-500" :
                  "bg-red-950 border-red-500",
                  isAlive ? "shadow-[0_0_15px_rgba(239,68,68,0.5)]" : ""
                )}
                style={{ 
                  left: `calc(16.67% * ${gx} + 8.33% - 20px)`, 
                  top: `calc(20% * ${gy} + 10% - 20px)` 
                }}
                onClick={() => isAlive && attackMutation.mutate(enemy.id)}
                whileHover={isAlive ? { scale: 1.1 } : {}}
                whileTap={isAlive ? { scale: 0.9 } : {}}
                data-testid={`unit-enemy-${enemy.id}`}
              >
                {enemy.type === 'boss' ? (
                  <Skull className="w-5 h-5 text-fuchsia-400" />
                ) : (
                  <span className="text-[9px] font-bold text-red-400">{enemy.name.substring(0, 2)}</span>
                )}
                {isAlive && (
                  <div className="absolute -bottom-2 w-8 h-1.5 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                    <div 
                      className="h-full bg-red-500 transition-all"
                      style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
                    />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Enemy Info */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          {enemies.map(enemy => (
            <div 
              key={enemy.id}
              className={cn(
                "p-2 rounded border text-xs",
                enemy.hp > 0 ? "bg-red-950/30 border-red-500/30" : "bg-gray-900/50 border-gray-700/30 opacity-50"
              )}
            >
              <div className="flex items-center justify-between">
                <span className={enemy.hp > 0 ? "text-red-400" : "text-gray-500"}>{enemy.name}</span>
                <span className="text-gray-400 font-mono">{enemy.hp}/{enemy.maxHp}</span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500">
                <span>DMG: {enemy.damage}</span>
                {enemy.type !== 'standard' && (
                  <span className={enemy.type === 'boss' ? "text-fuchsia-400" : "text-orange-400"}>
                    [{enemy.type.toUpperCase()}]
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hero Stats */}
      <div className={cn("mx-3 mt-3 p-3 rounded border bg-black/60", colors.border)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={cn("font-display font-bold", colors.text)}>{heroName}</span>
          </div>
          <div className="flex gap-4 text-xs font-mono">
            <div className="flex items-center gap-1">
              <Heart className="w-4 h-4 text-red-400" />
              <span className={heroHp < maxHP * 0.3 ? "text-red-400 animate-pulse" : "text-red-400"}>
                {heroHp}/{maxHP}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400">{currentPA}</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="w-4 h-4 text-fuchsia-400" />
              <span className="text-fuchsia-400">{currentR2}/{maxR2}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {!combatEnded && (
        <div className="mx-3 mt-3">
          <NeonButton 
            variant="secondary"
            onClick={() => endTurnMutation.mutate()}
            disabled={endTurnMutation.isPending}
            className="w-full"
            data-testid="button-end-turn"
          >
            FINE TURNO
          </NeonButton>
        </div>
      )}

      {/* Combat End Overlay */}
      <AnimatePresence>
        {combatEnded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/90 flex items-center justify-center z-50"
          >
            <div className="text-center p-6">
              {victory ? (
                <>
                  <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-display text-yellow-400 mb-2">VITTORIA!</h2>
                  <p className="text-gray-400 mb-6">Hai sconfitto tutti i nemici</p>
                  <NeonButton 
                    variant="primary"
                    onClick={() => claimRewardMutation.mutate()}
                    disabled={claimRewardMutation.isPending}
                    data-testid="button-claim-reward"
                  >
                    RISCUOTI RICOMPENSA
                  </NeonButton>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-display text-red-400 mb-2">SCONFITTA</h2>
                  <p className="text-gray-400 mb-6">Il tuo eroe e caduto...</p>
                  <NeonButton 
                    variant="secondary"
                    onClick={handleBack}
                    data-testid="button-return-defeat"
                  >
                    RITORNA
                  </NeonButton>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
