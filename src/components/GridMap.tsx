import { cn } from "@/lib/utils";
import { type Unit } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import { User, Skull } from "lucide-react";

interface GridMapProps {
  units: Unit[];
  activeUnitId?: string; // For game logic highlighting
  onCellClick: (x: number, y: number) => void;
  className?: string;
}

export function GridMap({ units, onCellClick, className }: GridMapProps) {
  // 6x5 Grid
  const rows = 5;
  const cols = 6;
  
  // Create grid cells
  const grid = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      grid.push({ x, y });
    }
  }

  const getUnitAt = (x: number, y: number) => units.find(u => u.x === x && u.y === y);

  return (
    <div className={cn("relative p-4 rounded-xl border border-primary/30 bg-black/80 shadow-[0_0_30px_rgba(0,255,255,0.1)]", className)}>
      {/* Screen Glare Effect */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-primary/5 via-transparent to-transparent rounded-xl z-10" />
      
      {/* Grid Container */}
      <div 
        className="grid gap-1 sm:gap-2 relative z-0" 
        style={{ 
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          perspective: "1000px" 
        }}
      >
        {grid.map((cell) => {
          const unit = getUnitAt(cell.x, cell.y);
          const isPlayer = unit?.type === "HERO";
          const isEnemy = unit?.type === "ENEMY";
          
          return (
            <div 
              key={`${cell.x}-${cell.y}`}
              onClick={() => onCellClick(cell.x, cell.y)}
              className={cn(
                "aspect-square rounded-md border border-white/10 bg-white/5 relative cursor-pointer hover:bg-white/10 transition-colors flex items-center justify-center",
                "before:absolute before:inset-0 before:opacity-0 hover:before:opacity-100 before:border before:border-primary/50 before:rounded-md before:transition-opacity",
                isPlayer && "border-primary/50 bg-primary/10 shadow-[inset_0_0_10px_rgba(0,255,255,0.2)]",
                isEnemy && "border-secondary/50 bg-secondary/10 shadow-[inset_0_0_10px_rgba(255,0,255,0.2)]"
              )}
            >
              {/* Grid Coordinates (Subtle) */}
              <span className="absolute bottom-0.5 right-1 text-[8px] font-mono text-white/20 select-none">
                {cell.x},{cell.y}
              </span>

              {/* Unit Render */}
              <AnimatePresence mode="wait">
                {unit && (
                  <motion.div
                    key={unit.id}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className={cn(
                      "w-3/4 h-3/4 rounded-full flex items-center justify-center relative shadow-lg",
                      isPlayer ? "bg-primary text-black" : "bg-secondary text-black"
                    )}
                  >
                    {isPlayer ? <User className="w-4 h-4" /> : <Skull className="w-4 h-4" />}
                    
                    {/* HP Bar Mini */}
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full", isPlayer ? "bg-green-500" : "bg-red-500")} 
                        style={{ width: `${(unit.hp / unit.maxHp) * 100}%` }} 
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
