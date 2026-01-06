import { type Card as CardType } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Zap, Move, Shield, Sword } from "lucide-react";
import { motion } from "framer-motion";

interface CardProps {
  card: CardType;
  onPlay: (id: number) => void;
  disabled?: boolean;
}

export function GameCard({ card, onPlay, disabled }: CardProps) {
  const isAttack = card.type === "ATTACK";
  const isMove = card.type === "MOVEMENT";
  
  const borderColor = isAttack ? "border-secondary" : (isMove ? "border-primary" : "border-white/50");
  const shadowColor = isAttack ? "shadow-secondary/20" : (isMove ? "shadow-primary/20" : "shadow-white/10");
  const textColor = isAttack ? "text-secondary" : (isMove ? "text-primary" : "text-foreground");

  const Icon = () => {
    if (card.type === "ATTACK") return <Sword className="w-5 h-5" />;
    if (card.type === "MOVEMENT") return <Move className="w-5 h-5" />;
    if (card.type === "DEFENSE") return <Shield className="w-5 h-5" />;
    return <Zap className="w-5 h-5" />;
  };

  return (
    <motion.div 
      whileHover={!disabled ? { y: -10, scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      className={cn(
        "relative w-full aspect-[2/3] max-w-[200px] rounded-xl border-2 bg-black/80 backdrop-blur-md overflow-hidden flex flex-col shadow-lg transition-colors cursor-pointer group",
        borderColor,
        shadowColor,
        disabled && "opacity-50 grayscale cursor-not-allowed"
      )}
      onClick={() => !disabled && onPlay(card.id)}
    >
      {/* Header */}
      <div className={cn("p-3 border-b border-inherit flex justify-between items-center bg-white/5", textColor)}>
        <span className="font-display font-bold text-sm tracking-wide">{card.name}</span>
        <div className="flex items-center gap-1 text-xs font-mono bg-black/50 px-1.5 py-0.5 rounded border border-inherit">
          <Zap className="w-3 h-3" />
          {card.paCost}
        </div>
      </div>

      {/* Body / Illustration Area */}
      <div className="flex-1 flex items-center justify-center p-4 relative group-hover:bg-white/5 transition-colors">
        <div className={cn("w-16 h-16 rounded-full border-2 flex items-center justify-center", borderColor, textColor)}>
          <Icon />
        </div>
        
        {/* Background grid pattern */}
        <div className="absolute inset-0 opacity-10" 
          style={{ backgroundImage: `radial-gradient(${isAttack ? '#ff00ff' : '#00ffff'} 1px, transparent 1px)`, backgroundSize: '10px 10px' }} 
        />
      </div>

      {/* Description */}
      <div className="p-3 text-xs text-muted-foreground font-body bg-black/60 border-t border-inherit min-h-[60px]">
        {card.description}
      </div>
    </motion.div>
  );
}
