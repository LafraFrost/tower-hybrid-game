import { Header } from "@/components/Header";
import { NeonCard } from "@/components/NeonCard";
import { useHero, GAME_DATA } from "@/context/HeroContext";
import { Shield, Zap, Crosshair, Heart, Swords } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Redirect } from "wouter";

export default function ProfileScreen() {
  const { playerState, isInitialized } = useHero();

  if (!isInitialized || !playerState) {
    return <Redirect to="/" />;
  }

  const { heroName, heroClass, currentHP, maxHP, currentPA, maxPA, currentR2, maxR2, r2Name, defense, abilities } = playerState;
  const colors = GAME_DATA.CLASS_COLORS[heroClass];

  return (
    <div className="min-h-screen">
      <Header title={heroName} subtitle={`${heroClass} // Combat Ready`} />

      <main className="px-4 space-y-6 max-w-md mx-auto">
        {/* Stats Overview */}
        <NeonCard variant="primary" glow className="space-y-4">
          <div className="flex justify-between items-end">
            <h3 className="text-cyan-400 font-display font-bold">Combat Metrics</h3>
            <span className={cn("text-xs font-mono uppercase", colors.text)}>{heroClass}</span>
          </div>

          {/* HP Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400 flex items-center gap-1">
                <Heart className="w-3 h-3 text-red-400" /> HP
              </span>
              <span className="text-red-400 font-bold font-mono">{currentHP}/{maxHP}</span>
            </div>
            <div className="h-3 w-full bg-gray-800 rounded-full overflow-hidden border border-gray-700">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(currentHP / maxHP) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-red-600 to-red-400 shadow-[0_0_10px_red]"
              />
            </div>
          </div>

          {/* PA Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400 flex items-center gap-1">
                <Zap className="w-3 h-3 text-yellow-400" /> Action Points
              </span>
              <span className="text-yellow-400 font-bold font-mono">{currentPA}/{maxPA}</span>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: maxPA }).map((_, i) => (
                <div 
                  key={i}
                  className={cn(
                    "flex-1 h-3 rounded border transition-all",
                    i < currentPA 
                      ? "bg-yellow-500 border-yellow-400 shadow-[0_0_8px_rgba(234,179,8,0.5)]" 
                      : "bg-gray-800 border-gray-700"
                  )}
                />
              ))}
            </div>
          </div>

          {/* R2 Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400 flex items-center gap-1">
                <Swords className="w-3 h-3 text-fuchsia-400" /> {r2Name}
              </span>
              <span className="text-fuchsia-400 font-bold font-mono">{currentR2}/{maxR2}</span>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: maxR2 }).map((_, i) => (
                <div 
                  key={i}
                  className={cn(
                    "flex-1 h-3 rounded border transition-all",
                    i < currentR2 
                      ? "bg-fuchsia-500 border-fuchsia-400 shadow-[0_0_8px_rgba(217,70,239,0.5)]" 
                      : "bg-gray-800 border-gray-700"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Defense */}
          <div className="flex items-center justify-between p-2 rounded bg-black/40 border border-white/5">
            <span className="text-gray-400 flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span className="text-sm">Defense</span>
            </span>
            <span className="text-cyan-400 font-display font-bold text-xl">{defense}</span>
          </div>
        </NeonCard>

        {/* Abilities */}
        <div>
          <h2 className="text-lg font-display font-bold text-white mb-3 flex items-center gap-2">
            <span className="w-1 h-6 bg-fuchsia-500 block shadow-[0_0_10px_magenta]" />
            Special Abilities
          </h2>
          
          <div className="space-y-3">
            {abilities.map((ability, index) => (
              <motion.div
                key={ability.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <NeonCard variant="secondary" className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="font-display font-bold text-white">{ability.name}</h4>
                    <div className="flex gap-2 text-[10px] font-mono">
                      <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                        PA: {ability.paCost}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30">
                        {r2Name}: {ability.r2Cost}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400">{ability.description}</p>
                </NeonCard>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
