import { NeonButton } from "@/components/NeonButton";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useState } from "react";
import { GAME_DATA, type HeroName } from "@/data/GameData";
import { useHero } from "@/context/HeroContext";
import { Shield, Sword, Sparkles, Heart, Wrench, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const CLASS_ICONS = {
  Tank: Shield,
  DPS: Sword,
  Control: Sparkles,
  Support: Heart,
  Specialist: Wrench,
};

export default function HeroSelection() {
  const [, setLocation] = useLocation();
  const { selectHero, setGameMode } = useHero();
  const [hoveredHero, setHoveredHero] = useState<HeroName | null>(null);
  const [selectedHeroName, setSelectedHeroName] = useState<HeroName | null>(null);

  const handleSelectHero = (heroName: HeroName) => {
    setSelectedHeroName(heroName);
  };

  const handleDeploy = () => {
    if (selectedHeroName) {
      selectHero(selectedHeroName);
      setGameMode('solo');
      setLocation("/home"); // Vai alla mappa casa con Segheria/Miniera
    }
  };

  const heroes = Object.entries(GAME_DATA.HERO_STATS) as [HeroName, typeof GAME_DATA.HERO_STATS[HeroName]][];
  const previewHero = hoveredHero || selectedHeroName;
  const previewStats = previewHero ? GAME_DATA.HERO_STATS[previewHero] : null;
  const previewAbilities = previewHero ? GAME_DATA.HERO_ABILITIES[previewHero] : null;

  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-black to-black" />

      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => setLocation("/")}
        className="z-20 flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors mb-4"
        data-testid="button-back"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-display text-sm uppercase">Exit</span>
      </motion.button>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="z-10 w-full max-w-lg mx-auto space-y-4 flex-1"
      >
        {/* Title */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-display font-black text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-fuchsia-500">
            CAMPAGNA SOLO
          </h1>
          <p className="text-cyan-500/80 font-mono tracking-[0.2em] text-xs uppercase">Seleziona il tuo Operativo</p>
        </div>

        {/* Hero Grid */}
        <div className="grid grid-cols-2 gap-2">
          {heroes.map(([name, stats]) => {
            const colors = GAME_DATA.CLASS_COLORS[stats.class as keyof typeof GAME_DATA.CLASS_COLORS];
            const Icon = CLASS_ICONS[stats.class as keyof typeof CLASS_ICONS];
            const isSelected = selectedHeroName === name;
            
            return (
              <motion.button
                key={name}
                onClick={() => handleSelectHero(name)}
                onMouseEnter={() => setHoveredHero(name)}
                onMouseLeave={() => setHoveredHero(null)}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "relative p-3 rounded border transition-all text-left",
                  colors.bg,
                  isSelected ? `${colors.border} border-2 shadow-[0_0_15px_rgba(0,255,255,0.3)]` : "border-gray-800",
                  "hover:border-gray-600"
                )}
                data-testid={`button-hero-${name.toLowerCase()}`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={cn("w-4 h-4", colors.text)} />
                  <span className="font-display font-bold text-white text-sm">{name}</span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400 font-mono">
                  <span>HP:{stats.HP_BASE}</span>
                  <span>DEF:{stats.DEF_INIT}</span>
                  <span>{stats.R2_NAME}:{stats.R2_MAX}</span>
                </div>
                {isSelected && (
                  <motion.div 
                    layoutId="selected-indicator"
                    className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_cyan]"
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Hero Preview */}
        {previewStats && previewAbilities && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded border border-gray-800 bg-gray-900/50 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-cyan-400">{previewHero}</h3>
                <p className="text-xs text-gray-500">{previewStats.class}</p>
              </div>
              <div className="text-right text-xs font-mono text-gray-400">
                <div>HP: {previewStats.HP_BASE} | DEF: {previewStats.DEF_INIT}</div>
                <div>{previewStats.R2_NAME}: 0/{previewStats.R2_MAX}</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-[10px] text-fuchsia-400 uppercase tracking-wider">Abilities</p>
              {previewAbilities.map((ability, i) => (
                <div key={i} className="text-xs p-2 rounded bg-black/50 border border-gray-800">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-medium">{ability.name}</span>
                    <span className="text-gray-500 font-mono text-[10px]">
                      PA:{ability.paCost} | R2:{ability.r2Cost}
                    </span>
                  </div>
                  <p className="text-gray-400 mt-1">{ability.description}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Deploy Button */}
        <div className="text-center pt-2">
          <NeonButton 
            size="lg" 
            className={cn(
              "w-full",
              !selectedHeroName && "opacity-50 cursor-not-allowed"
            )}
            onClick={handleDeploy}
            disabled={!selectedHeroName}
            data-testid="button-deploy"
          >
            {selectedHeroName ? `DEPLOY ${selectedHeroName.toUpperCase()}` : "SELEZIONA OPERATIVO"}
          </NeonButton>
        </div>
      </motion.div>
    </div>
  );
}
