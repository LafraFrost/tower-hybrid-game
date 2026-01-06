import { useGameState, useMoveUnit } from "@/hooks/use-game";
import { GridMap } from "@/components/GridMap";
import { StatDisplay } from "@/components/StatDisplay";
import { Loader2, Zap, Heart, Shield } from "lucide-react";
import { type Unit } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function TacticalView({ gameId }: { gameId: number }) {
  const { data: gameState, isLoading, error } = useGameState(gameId);
  const { mutate: moveUnit } = useMoveUnit();
  const { toast } = useToast();

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !gameState) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-6">
        <h2 className="text-xl font-display text-destructive mb-2">Connection Lost</h2>
        <p className="text-muted-foreground">Failed to sync with tactical mainframe.</p>
      </div>
    );
  }

  // Assume user controls the first HERO found for now (multiplayer logic would filter by userId)
  const playerUnit = gameState.units.find(u => u.type === "HERO");

  const handleCellClick = (x: number, y: number) => {
    if (!playerUnit) return;
    
    // Calculate distance (Manhattan or Chebyshev)
    const dist = Math.abs(playerUnit.x - x) + Math.abs(playerUnit.y - y);
    
    if (dist === 0) {
      toast({ description: "You are already here." });
      return;
    }

    if (dist > 1) {
      toast({ 
        title: "Out of Range", 
        description: "Unit can only move 1 tile at a time.", 
        variant: "destructive" 
      });
      return;
    }

    moveUnit({ unitId: playerUnit.id, x, y });
  };

  return (
    <div className="flex flex-col h-full gap-6 p-4 overflow-y-auto">
      {/* Header Stats */}
      {playerUnit && (
        <div className="grid grid-cols-3 gap-3">
          <StatDisplay 
            label="HP" 
            value={`${playerUnit.hp}/${playerUnit.maxHp}`} 
            icon={<Heart className="w-3 h-3" />} 
            color="green" 
          />
          <StatDisplay 
            label="PA" 
            value={playerUnit.pa || 0} 
            icon={<Zap className="w-3 h-3" />} 
            color="cyan" 
          />
          <StatDisplay 
            label="R2" 
            value={playerUnit.r2 || 0} 
            icon={<Shield className="w-3 h-3" />} 
            color="magenta" 
          />
        </div>
      )}

      {/* Main Map */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-md aspect-[6/5]">
          <GridMap 
            units={gameState.units} 
            onCellClick={handleCellClick}
            className="w-full h-full"
          />
        </div>
        <p className="mt-4 text-xs font-mono text-primary/60 text-center animate-pulse">
          TACTICAL GRID ONLINE // SELECT TILE TO MOVE
        </p>
      </div>
    </div>
  );
}
