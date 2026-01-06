import { NeonButton } from "@/components/NeonButton";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useHero } from "@/context/HeroContext";
import { Sword, QrCode } from "lucide-react";

export default function ModeMenu() {
  const [, setLocation] = useLocation();
  const { setGameMode } = useHero();

  const goSolo = () => {
    setGameMode('solo');
    setLocation('/solo');
  };

  const goTabletop = () => {
    setGameMode('tabletop');
    setLocation('/tabletop');
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900/15 via-black to-black" />
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url('/assets/sfondo%20mappa%20nodi.png')", backgroundSize: 'cover', filter: 'grayscale(0.2)' }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="z-10 w-full max-w-lg space-y-8 text-center bg-black/60 backdrop-blur-lg border border-amber-500/30 rounded-2xl p-6 shadow-[0_0_40px_rgba(251,191,36,0.15)]"
      >
        <div className="space-y-1">
          <p className="text-xs font-mono uppercase tracking-[0.3em] text-amber-300/70">Initialize System</p>
          <h1 className="text-3xl font-display font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-300 to-amber-500">
            Menu Iniziale
          </h1>
          <p className="text-amber-100/70 text-sm">Scegli il percorso: Solo o Sessione da Tavolo.</p>
        </div>

        <div className="space-y-4">
          <NeonButton
            size="lg"
            className="w-full h-20 text-lg gap-3 bg-amber-600 hover:bg-amber-500"
            onClick={goSolo}
            data-testid="button-mode-solo"
          >
            <Sword className="w-6 h-6" />
            <div className="flex flex-col items-start">
              <span className="font-display font-bold">SOLO</span>
              <span className="text-[10px] text-amber-200/70 font-mono">Vai alla mappa a 22 snodi</span>
            </div>
          </NeonButton>

          <NeonButton
            size="lg"
            variant="secondary"
            className="w-full h-20 text-lg gap-3"
            onClick={goTabletop}
            data-testid="button-mode-tabletop"
          >
            <QrCode className="w-6 h-6" />
            <div className="flex flex-col items-start">
              <span className="font-display font-bold">TAVOLO</span>
              <span className="text-[10px] text-fuchsia-200/70 font-mono">Avvia il Room Manager</span>
            </div>
          </NeonButton>
        </div>
      </motion.div>
    </div>
  );
}
