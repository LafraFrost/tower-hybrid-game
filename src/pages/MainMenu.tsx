import { NeonButton } from "@/components/NeonButton";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { User, QrCode, LogIn, LogOut, Shield } from "lucide-react";
import { useCustomAuth } from "@/hooks/use-custom-auth";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

interface SiteQRResponse {
  qrCode: string;
  siteUrl: string;
}

export default function MainMenu() {
  const [, setLocation] = useLocation();
  const { user, isLoading, isAuthenticated, isAdmin, logout } = useCustomAuth();

  const qrQuery = useQuery<SiteQRResponse>({
    queryKey: ['/api/site-qr'],
  });

  const handleLogin = () => {
    setLocation("/auth");
  };

  // Reindirizza a /auth se non autenticato e non in loading
  if (!isLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden p-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-black to-black" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-fuchsia-500 to-transparent opacity-50" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="z-10 w-full max-w-md space-y-8 text-center"
        >
          <div className="space-y-2">
            <motion.h1 
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              className="text-5xl md:text-6xl font-display font-black text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-fuchsia-500"
            >
              TOWER HYBRID
            </motion.h1>
            <p className="text-cyan-500/80 font-mono tracking-[0.2em] text-xs uppercase">Phygital Board Game Companion</p>
          </div>
          
          <div className="h-px w-32 bg-gradient-to-r from-transparent via-gray-500 to-transparent mx-auto" />
          
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-gray-300 text-center mb-6"
            >
              <p className="mb-6 text-sm">Accedi per iniziare il tuo viaggio</p>
              <Button
                onClick={handleLogin}
                className="w-full gap-2 bg-cyan-600 hover:bg-cyan-500 text-lg py-6"
              >
                <LogIn className="w-5 h-5" />
                Accedi o Registrati
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-black to-black" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-fuchsia-500 to-transparent opacity-50" />
      
      {/* Animated Grid Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(cyan 1px, transparent 1px), linear-gradient(90deg, cyan 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* User Status Bar */}
      <div className="absolute top-4 right-4 z-20">
        {isLoading ? (
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        ) : isAuthenticated && user ? (
          <div className="flex items-center gap-3 bg-black/60 backdrop-blur px-3 py-2 rounded-lg border border-cyan-500/30">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-fuchsia-500 flex items-center justify-center text-xs font-bold text-white">
              {(user.firstName?.[0] || user.email[0]).toUpperCase()}
            </div>
            <span className="text-cyan-400 text-sm font-mono">{user.firstName || user.email}</span>
            {isAdmin && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setLocation('/admin')}
                className="text-fuchsia-400 hover:text-fuchsia-300"
                data-testid="button-admin"
              >
                <Shield className="w-4 h-4" />
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              onClick={() => logout()}
              className="text-red-400 hover:text-red-300"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleLogin}
            className="gap-2 bg-cyan-600 hover:bg-cyan-500"
            data-testid="button-login"
          >
            <LogIn className="w-4 h-4" />
            Accedi
          </Button>
        )}
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="z-10 w-full max-w-md space-y-8 text-center"
      >
        {/* Title */}
        <div className="space-y-2">
          <motion.h1 
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="text-5xl md:text-6xl font-display font-black text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-fuchsia-500"
          >
            TOWER HYBRID
          </motion.h1>
          <p className="text-cyan-500/80 font-mono tracking-[0.2em] text-xs uppercase">Phygital Board Game Companion</p>
        </div>

        <div className="h-px w-32 bg-gradient-to-r from-transparent via-gray-500 to-transparent mx-auto" />

        {/* Game Mode Buttons */}
        <div className="space-y-4">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <NeonButton 
              size="lg" 
              className="w-full h-20 text-lg gap-3"
              onClick={() => setLocation("/select-hero")}
              data-testid="button-solo-campaign"
            >
              <User className="w-6 h-6" />
              <div className="flex flex-col items-start">
                <span className="font-display font-bold">CAMPAGNA SOLO</span>
                <span className="text-[10px] text-cyan-300/60 font-mono">Progressione personale</span>
              </div>
            </NeonButton>
          </motion.div>

          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <NeonButton 
              size="lg" 
              variant="secondary"
              className="w-full h-20 text-lg gap-3"
              onClick={() => setLocation("/tabletop")}
              data-testid="button-tabletop-session"
            >
              <QrCode className="w-6 h-6" />
              <div className="flex flex-col items-start">
                <span className="font-display font-bold">SESSIONE DA TAVOLO</span>
                <span className="text-[10px] text-fuchsia-300/60 font-mono">Scansiona QR e gioca</span>
              </div>
            </NeonButton>
          </motion.div>
        </div>

        <p className="text-[10px] text-gray-600 font-mono">
          V.1.0.7 // HYBRID PROTOCOL ACTIVE
        </p>

        {/* QR Code Section */}
        {qrQuery.data && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="pt-4 border-t border-gray-800"
          >
            <p className="text-[10px] text-gray-500 font-mono mb-3 uppercase tracking-wider">
              Scansiona per accedere
            </p>
            <div className="flex justify-center">
              <div className="p-2 bg-black border border-cyan-500/30 rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                <img 
                  src={qrQuery.data.qrCode} 
                  alt="QR Code sito" 
                  className="w-24 h-24"
                  data-testid="img-site-qr"
                />
              </div>
            </div>
            <p className="text-[8px] text-gray-600 font-mono mt-2 break-all">
              {qrQuery.data.siteUrl}
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
