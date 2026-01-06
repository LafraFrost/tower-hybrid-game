import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabaseClient";
import { NeonButton } from "@/components/NeonButton";
import { motion } from "framer-motion";
import { 
  Sword, 
  Crown, 
  ShoppingCart, 
  Wind, 
  Skull,
  LogOut 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ActionType = "combat" | "elite" | "merchant" | "rest" | "boss";

export default function RoomDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Get room code from session/context
    const code = sessionStorage.getItem("currentRoomCode");
    if (!code) {
      setLocation("/tabletop");
      return;
    }
    setRoomCode(code);
    
    // Subscribe to room updates
    const channel = supabase
      .channel(`game_room:${code}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_sessions",
          filter: `room_code=eq.${code}`,
        },
        (payload: any) => {
          if (payload.new?.players) {
            setPlayers(payload.new.players);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [setLocation]);

  const handleAction = async (action: ActionType) => {
    if (!roomCode) return;
    
    setLoading(true);
    try {
      const statusMap: Record<ActionType, string> = {
        combat: "combat",
        elite: "elite",
        merchant: "merchant",
        rest: "rest",
        boss: "boss",
      };

      await supabase
        .from("game_sessions")
        .update({ status: statusMap[action] })
        .eq("room_code", roomCode);

      toast({
        title: `${action.toUpperCase()} Attivato`,
        description: `Tutti i giocatori vedranno: ${action.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile inviare il comando",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExit = () => {
    sessionStorage.removeItem("currentRoomCode");
    setLocation("/tabletop");
  };

  const actions: Array<{
    id: ActionType;
    label: string;
    icon: React.ReactNode;
    color: string;
    description: string;
  }> = [
    {
      id: "combat",
      label: "COMBATTIMENTO",
      icon: <Sword className="w-8 h-8" />,
      color: "from-red-600 to-red-800",
      description: "Battaglia standard",
    },
    {
      id: "elite",
      label: "ELITE",
      icon: <Crown className="w-8 h-8" />,
      color: "from-yellow-600 to-orange-800",
      description: "Nemico speciale",
    },
    {
      id: "merchant",
      label: "MERCANTE",
      icon: <ShoppingCart className="w-8 h-8" />,
      color: "from-green-600 to-emerald-800",
      description: "Negozio",
    },
    {
      id: "rest",
      label: "RIPOSO",
      icon: <Wind className="w-8 h-8" />,
      color: "from-blue-600 to-cyan-800",
      description: "Recupero",
    },
    {
      id: "boss",
      label: "BOSS",
      icon: <Skull className="w-8 h-8" />,
      color: "from-purple-600 to-pink-800",
      description: "Scontro finale",
    },
  ];

  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-fuchsia-900/20 via-black to-black" />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-20 mb-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-500">
              TELECOMANDO STANZA
            </h1>
            <p className="text-fuchsia-500/60 font-mono text-xs uppercase tracking-[0.2em] mt-1">
              Codice: {roomCode}
            </p>
          </div>
          <NeonButton
            size="sm"
            variant="secondary"
            onClick={handleExit}
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            Esci
          </NeonButton>
        </div>
      </motion.div>

      {/* Player List */}
      {players.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6 bg-fuchsia-900/20 border border-fuchsia-500/30 rounded-lg p-4 z-10"
        >
          <p className="text-xs text-fuchsia-300 font-mono mb-2 uppercase">
            Giocatori Online ({players.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {players.map((player: any, idx: number) => (
              <div
                key={idx}
                className="px-3 py-1 bg-fuchsia-500/20 border border-fuchsia-500/50 rounded text-cyan-400 text-sm font-display"
              >
                {player.name} ({player.class})
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Action Buttons Grid */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ staggerChildren: 0.1 }}
        className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 z-10 auto-rows-max content-center"
      >
        {actions.map((action) => (
          <motion.button
            key={action.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleAction(action.id)}
            disabled={loading}
            className={`
              relative p-6 rounded-2xl border-2 border-transparent
              bg-gradient-to-br ${action.color}
              text-white font-display font-bold text-lg uppercase
              transition-all duration-300 overflow-hidden group
              hover:shadow-lg hover:shadow-fuchsia-500/50
              disabled:opacity-50
            `}
          >
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
            <div className="relative z-10 flex flex-col items-center gap-3">
              {action.icon}
              <span>{action.label}</span>
              <span className="text-[10px] opacity-70">{action.description}</span>
            </div>
          </motion.button>
        ))}
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-gray-500 text-xs font-mono mt-6 z-10"
      >
        Premi un pulsante per sincronizzare l'azione a tutti i giocatori
      </motion.p>
    </div>
  );
}
