import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, Shield, Zap, Skull, Trophy, AlertTriangle, Sword } from "lucide-react";
import { cn } from "@/lib/utils";
import { NeonButton } from "@/components/NeonButton";

interface VillageDefenseCombatProps {
  buildingName: string;
  onVictory: (buildingName: string) => void;
  onDefeat: (buildingName: string) => void;
  onClose: () => void;
}

interface Enemy {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  damage: number;
  type: 'goblin' | 'elite' | 'boss';
}

export function VillageDefenseCombat({ buildingName, onVictory, onDefeat, onClose }: VillageDefenseCombatProps) {
  const [playerHp, setPlayerHp] = useState(100);
  const [playerMaxHp] = useState(100);
  const [playerPA, setPlayerPA] = useState(3);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [combatEnded, setCombatEnded] = useState(false);
  const [victory, setVictory] = useState(false);
  const [message, setMessage] = useState('');

  // Initialize enemies on mount
  useEffect(() => {
    const goblinCount = Math.floor(Math.random() * 2) + 2; // 2-3 goblins
    const newEnemies: Enemy[] = [];
    
    for (let i = 0; i < goblinCount; i++) {
      newEnemies.push({
        id: `goblin_${i}`,
        name: `Goblin ${i + 1}`,
        hp: 30,
        maxHp: 30,
        damage: 8,
        type: 'goblin'
      });
    }
    
    setEnemies(newEnemies);
  }, []);

  const handleAttack = (enemyId: string) => {
    if (playerPA <= 0) {
      setMessage('❌ Punti Azione esauriti! Fine turno per ricaricare.');
      return;
    }

    // Player attacks
    const damage = Math.floor(Math.random() * 15) + 10; // 10-24 damage
    setPlayerPA(prev => prev - 1);

    setEnemies(prev => {
      const updated = prev.map(e => {
        if (e.id === enemyId) {
          const newHp = Math.max(0, e.hp - damage);
          return { ...e, hp: newHp };
        }
        return e;
      });

      // Check if all enemies defeated
      if (updated.every(e => e.hp <= 0)) {
        setCombatEnded(true);
        setVictory(true);
        setMessage(`✅ Hai difeso ${buildingName}!`);
        setTimeout(() => onVictory(buildingName), 2000);
      }

      return updated;
    });

    setMessage(`⚔️ Inflitti ${damage} danni!`);
  };

  const handleEndTurn = () => {
    // Recharge PA
    setPlayerPA(3);

    // Enemies attack
    const aliveEnemies = enemies.filter(e => e.hp > 0);
    const totalDamage = aliveEnemies.reduce((sum, e) => sum + e.damage, 0);
    
    const newHp = Math.max(0, playerHp - totalDamage);
    setPlayerHp(newHp);

    if (newHp <= 0) {
      setCombatEnded(true);
      setVictory(false);
      setMessage(`💀 ${buildingName} è caduto!`);
      setTimeout(() => onDefeat(buildingName), 2000);
    } else {
      setMessage(`🛡️ Subiti ${totalDamage} danni! Turno successivo.`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-[200]"
      onClick={(e) => e.target === e.currentTarget && !combatEnded && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-4xl mx-4 bg-gradient-to-b from-red-950/90 via-black/95 to-black/95 rounded-2xl border-2 border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.3)] overflow-hidden"
      >
        {/* Header */}
        <div className="relative flex items-center justify-between p-4 border-b border-red-500/30 bg-black/60">
          <div className="flex items-center gap-3">
            <Sword className="w-6 h-6 text-red-400" />
            <div>
              <h2 className="text-xl font-display text-red-400 uppercase tracking-wider">
                Difesa: {buildingName}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">Sconfiggi tutti i Goblin per salvare l'edificio</p>
            </div>
          </div>
          {!combatEnded && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-red-400 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Combat Grid Area */}
        <div className="p-6">
          {/* Player Stats */}
          <div className="flex items-center justify-between mb-6 p-4 bg-cyan-900/20 rounded-lg border border-cyan-500/30">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-cyan-500 border-2 border-cyan-300 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.5)]">
                <span className="text-lg font-bold text-black">🛡️</span>
              </div>
              <div>
                <p className="text-sm font-display text-cyan-400 uppercase">Difensore</p>
                <div className="flex items-center gap-4 mt-1">
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4 text-red-400" />
                    <span className={cn(
                      "font-mono text-sm",
                      playerHp < playerMaxHp * 0.3 ? "text-red-400 animate-pulse" : "text-red-400"
                    )}>
                      {playerHp}/{playerMaxHp}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="font-mono text-sm text-yellow-400">{playerPA}/3 PA</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enemies Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {enemies.map((enemy) => {
              const isAlive = enemy.hp > 0;
              return (
                <motion.div
                  key={enemy.id}
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ 
                    scale: isAlive ? 1 : 0.8, 
                    opacity: isAlive ? 1 : 0.3,
                    rotate: isAlive ? 0 : -45
                  }}
                  className={cn(
                    "relative p-4 rounded-lg border-2 transition-all cursor-pointer",
                    isAlive 
                      ? "bg-red-950/50 border-red-500 hover:border-red-400 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]" 
                      : "bg-gray-900/30 border-gray-700 cursor-not-allowed"
                  )}
                  onClick={() => isAlive && handleAttack(enemy.id)}
                  whileHover={isAlive ? { scale: 1.05, y: -4 } : {}}
                  whileTap={isAlive ? { scale: 0.95 } : {}}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Skull className={cn("w-5 h-5", isAlive ? "text-red-400" : "text-gray-600")} />
                      <span className={cn("font-display font-bold text-sm", isAlive ? "text-red-400" : "text-gray-600")}>
                        {enemy.name}
                      </span>
                    </div>
                  </div>
                  
                  {/* HP Bar */}
                  <div className="mb-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-400">HP</span>
                      <span className="text-xs font-mono text-gray-400">{enemy.hp}/{enemy.maxHp}</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                      <div 
                        className="h-full bg-red-500 transition-all duration-300"
                        style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Sword className="w-3 h-3" />
                    <span>DMG: {enemy.damage}</span>
                  </div>

                  {isAlive && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-600 border-2 border-red-400 flex items-center justify-center animate-pulse">
                      <span className="text-[10px] font-bold text-white">!</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Message */}
          <AnimatePresence mode="wait">
            {message && (
              <motion.div
                key={message}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mb-4 p-3 bg-black/60 rounded-lg border border-cyan-500/30 text-center"
              >
                <p className="text-sm text-cyan-400">{message}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          {!combatEnded && (
            <div className="flex gap-3">
              <NeonButton
                variant="secondary"
                onClick={handleEndTurn}
                className="flex-1"
              >
                🔄 FINE TURNO (Ricarica PA)
              </NeonButton>
            </div>
          )}
        </div>

        {/* Combat End Overlay */}
        <AnimatePresence>
          {combatEnded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black/95 flex items-center justify-center z-50"
            >
              <div className="text-center p-8">
                {victory ? (
                  <>
                    <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4 animate-bounce" />
                    <h2 className="text-3xl font-display text-yellow-400 mb-2">VITTORIA!</h2>
                    <p className="text-gray-400 mb-6">{buildingName} è stato salvato!</p>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-20 h-20 text-red-400 mx-auto mb-4 animate-pulse" />
                    <h2 className="text-3xl font-display text-red-400 mb-2">SCONFITTA</h2>
                    <p className="text-gray-400 mb-6">{buildingName} è stato distrutto...</p>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
