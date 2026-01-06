import { Header } from "@/components/Header";
import { NeonCard } from "@/components/NeonCard";
import { NeonButton } from "@/components/NeonButton";
import { useHero, GAME_DATA } from "@/context/HeroContext";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Move, Shield, Sword, Heart, Sparkles, Settings, Coins } from "lucide-react";
import { Redirect } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { CardType, GameCard } from "@/data/GameData";

const CARD_STYLES: Record<CardType, { Icon: typeof Zap; border: string; text: string; glow: string }> = {
  Attack: { Icon: Sword, border: "border-red-500", text: "text-red-400", glow: "shadow-[0_0_15px_rgba(239,68,68,0.2)]" },
  Defense: { Icon: Shield, border: "border-blue-500", text: "text-blue-400", glow: "shadow-[0_0_15px_rgba(59,130,246,0.2)]" },
  Movement: { Icon: Move, border: "border-green-500", text: "text-green-400", glow: "shadow-[0_0_15px_rgba(34,197,94,0.2)]" },
  Heal: { Icon: Heart, border: "border-pink-500", text: "text-pink-400", glow: "shadow-[0_0_15px_rgba(236,72,153,0.2)]" },
  Utility: { Icon: Settings, border: "border-cyan-500", text: "text-cyan-400", glow: "shadow-[0_0_15px_rgba(6,182,212,0.2)]" },
  Debuff: { Icon: Sparkles, border: "border-purple-500", text: "text-purple-400", glow: "shadow-[0_0_15px_rgba(168,85,247,0.2)]" },
};

interface SessionData {
  id: number;
  nodeCounter: number;
  credits: number;
  currentHp: number;
}

export default function DeckScreen() {
  const { playerState, isInitialized } = useHero();

  const sessionQuery = useQuery<SessionData>({
    queryKey: ['/api/hero-session', playerState?.heroName],
    enabled: !!playerState
  });

  if (!isInitialized || !playerState) {
    return <Redirect to="/" />;
  }

  const { hand, heroName, heroClass, currentPA, maxHP, currentHP } = playerState;
  const colors = GAME_DATA.CLASS_COLORS[heroClass];
  const sessionData = sessionQuery.data;
  const displayHp = sessionData?.currentHp ?? currentHP;
  const credits = sessionData?.credits ?? 100;
  const nodeCounter = sessionData?.nodeCounter ?? 0;

  return (
    <div className="min-h-screen">
      <Header title="Hand Deck" subtitle={`${heroName} // ${hand.length} Cards`} />

      <main className="max-w-md mx-auto px-4 pb-24">
        {/* Hero Stats Section */}
        <div className={cn("mb-4 p-3 rounded border bg-black/60 backdrop-blur", colors.border, colors.bg)}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className={cn("w-10 h-10 rounded-full border-2 flex items-center justify-center", colors.border, colors.bg)}>
                <span className={cn("text-sm font-bold", colors.text)}>{heroName.substring(0, 2)}</span>
              </div>
              <div>
                <p className={cn("text-sm font-display font-bold", colors.text)}>{heroName}</p>
                <p className="text-[10px] text-gray-500">{heroClass}</p>
              </div>
            </div>
            <div className="flex gap-4 text-xs font-mono">
              <div className="flex items-center gap-1">
                <Heart className="w-4 h-4 text-red-400" />
                <span className="text-red-400">{displayHp}/{maxHP}</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400">{currentPA}</span>
              </div>
              <div className="flex items-center gap-1">
                <Coins className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400">{credits}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-2 flex items-center justify-between text-[10px]">
            <span className="text-gray-500">Nodi esplorati:</span>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-32 bg-gray-800 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-fuchsia-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (nodeCounter / 10) * 100)}%` }}
                />
              </div>
              <span className="text-cyan-400 font-mono">{nodeCounter}</span>
            </div>
          </div>
        </div>

        {/* PA Indicator */}
        <div className="mb-4 p-3 rounded border border-yellow-500/30 bg-yellow-500/10 flex items-center justify-between">
          <span className="text-yellow-400 font-display text-sm">Action Points Available</span>
          <div className="flex gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div 
                key={i}
                className={cn(
                  "w-6 h-6 rounded flex items-center justify-center font-bold text-xs border transition-all",
                  i < currentPA 
                    ? "bg-yellow-500 border-yellow-400 text-black shadow-[0_0_8px_rgba(234,179,8,0.5)]" 
                    : "bg-gray-800 border-gray-700 text-gray-600"
                )}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <AnimatePresence>
            {hand.map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: -50 }}
                transition={{ delay: index * 0.1 }}
              >
                <CardComponent 
                  card={card} 
                  canPlay={currentPA >= card.paCost}
                  onPlay={() => console.log('Play card:', card.name)} 
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {hand.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <p>NO ACTIVE CARDS</p>
            <p className="text-xs mt-2">Wait for next turn cycle</p>
          </div>
        )}
      </main>
    </div>
  );
}

function CardComponent({ card, canPlay, onPlay }: { card: GameCard; canPlay: boolean; onPlay: () => void }) {
  const style = CARD_STYLES[card.type] || CARD_STYLES.Utility;
  const { Icon, border, text, glow } = style;

  return (
    <div className={cn(
      "aspect-[3/4] bg-black border-2 rounded-xl p-3 flex flex-col justify-between relative overflow-hidden group hover:-translate-y-2 transition-transform duration-300",
      border,
      glow,
      !canPlay && "opacity-50"
    )}>
      {/* Background Effect */}
      <div className={cn("absolute inset-0 opacity-10 bg-gradient-to-b from-transparent to-current", text)} />
      
      {/* Header */}
      <div className="flex justify-between items-start z-10">
        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bg-gray-900 border", border, text)}>
          {card.paCost}
        </div>
        <Icon className={cn("w-5 h-5", text)} />
      </div>

      {/* Content */}
      <div className="z-10 text-center flex-1 flex flex-col justify-center">
        <h3 className={cn("font-display font-bold uppercase text-sm mb-1", text)}>{card.name}</h3>
        <p className="text-[10px] text-gray-500 font-mono uppercase">{card.type}</p>
      </div>

      {/* Footer / Action */}
      <div className="z-10 mt-2">
        <NeonButton 
          size="sm" 
          variant="ghost" 
          className={cn(
            "w-full text-[10px] h-7 border border-white/10",
            canPlay ? "hover:bg-white/10" : "cursor-not-allowed"
          )}
          onClick={canPlay ? onPlay : undefined}
          disabled={!canPlay}
        >
          {canPlay ? "ACTIVATE" : "NO PA"}
        </NeonButton>
      </div>
    </div>
  );
}
