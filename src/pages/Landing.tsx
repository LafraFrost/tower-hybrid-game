import { NeonButton } from "@/components/NeonButton";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { LogIn, LogOut, Shield, User } from "lucide-react";
import { useCustomAuth } from "@/hooks/use-custom-auth";
import { Button } from "@/components/ui/button";

export default function Landing() {
  const [, setLocation] = useLocation();
  const { user, isLoading, isAuthenticated, isAdmin, logout } = useCustomAuth();

  const handleLogin = () => {
    setLocation("/auth");
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-black to-black" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-fuchsia-500 to-transparent opacity-50" />

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
        className="z-10 w-full max-w-md space-y-8"
      >
        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-display font-black text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-fuchsia-500">
            TOWER HYBRID
          </h1>
          <p className="text-cyan-500/80 font-mono tracking-[0.2em] text-xs uppercase">Il Bivio</p>
        </div>

        {/* Mode Selection Buttons */}
        <div className="space-y-4">
          <NeonButton 
            size="lg" 
            className="w-full"
            onClick={() => setLocation("/hero-selection")}
            data-testid="button-single"
          >
            SINGOLO
          </NeonButton>

          <NeonButton 
            size="lg" 
            className="w-full"
            onClick={() => setLocation("/tactical")}
            data-testid="button-create-room"
          >
            CREA STANZA
          </NeonButton>

          <NeonButton 
            size="lg" 
            className="w-full"
            onClick={() => setLocation("/mode")}
            data-testid="button-join-room"
          >
            ENTRA STANZA
          </NeonButton>
        </div>

        <p className="text-center text-[10px] text-gray-600 font-mono">
          PHYGITAL MODE // V.1.0.5
        </p>
      </motion.div>
    </div>
  );
}
