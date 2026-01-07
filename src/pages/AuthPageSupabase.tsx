import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, LogIn, UserPlus, ArrowLeft, Camera, MapPin, Check, Mail } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

type AuthMode = "login" | "register";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState({
    camera: false,
    location: false
  });
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: ""
  });

  const requestCameraPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setPermissionsGranted(prev => ({ ...prev, camera: true }));
      toast({ title: "Fotocamera autorizzata", description: "Permesso concesso" });
      localStorage.setItem('camera_permission', 'true');
      return true;
    } catch (error) {
      toast({ title: "Fotocamera non autorizzata", description: "Puoi abilitarla dopo nelle impostazioni", variant: "destructive" });
      return false;
    }
  }, [toast]);

  const requestLocationPermission = useCallback(async () => {
    return new Promise<boolean>((resolve) => {
      if (!navigator.geolocation) {
        toast({ title: "GPS non disponibile", description: "Il tuo dispositivo non supporta la geolocalizzazione", variant: "destructive" });
        resolve(false);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('✅ GPS position received:', position.coords);
          setPermissionsGranted(prev => ({ ...prev, location: true }));
          toast({ title: "Localizzazione autorizzata", description: "Permesso concesso" });
          localStorage.setItem('location_permission', 'true');
          
          // Salva la location attuale
          const currentLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          };
          console.log('📍 Saving location:', currentLocation);
          localStorage.setItem('last_location', JSON.stringify(currentLocation));
          
          // Salva anche nella cronologia per l'admin panel
          try {
            const historyStr = localStorage.getItem('gps_tracking_history') || '[]';
            const history = JSON.parse(historyStr);
            history.push(currentLocation);
            // Mantieni solo le ultime 100 location
            if (history.length > 100) {
              history.shift();
            }
            localStorage.setItem('gps_tracking_history', JSON.stringify(history));
            console.log('📊 GPS history saved, total entries:', history.length);
          } catch (error) {
            console.error('Error saving GPS history:', error);
          }
          
          resolve(true);
        },
        (error) => {
          console.error('❌ GPS error:', error);
          toast({ title: "Localizzazione non autorizzata", description: "Puoi abilitarla dopo nelle impostazioni", variant: "destructive" });
          resolve(false);
        },
        { enableHighAccuracy: true }
      );
    });
  }, [toast]);

  const handlePermissionsComplete = async () => {
    setLocation("/");
  };

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      console.log("Attempting login with:", formData.email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        console.error("Supabase login error:", error);
        throw error;
      }

      console.log("Login successful:", data);
      toast({
        title: "Accesso effettuato",
        description: `Benvenuto, ${formData.email}!`
      });
      setShowPermissions(true);
    } catch (error: any) {
      console.error("Login failed:", error);
      toast({
        title: "Errore di login",
        description: error.message || "Credenziali non valide. Assicurati di aver creato un account prima.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Errore",
        description: "Le password non corrispondono",
        variant: "destructive"
      });
      return;
    }
    if (formData.password.length < 6) {
      toast({
        title: "Errore",
        description: "La password deve avere almeno 6 caratteri",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log("Attempting registration with:", formData.email);
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
          },
          emailRedirectTo: `${window.location.origin}/`,
        }
      });

      if (error) {
        console.error("Supabase registration error:", error);
        throw error;
      }

      console.log("Registration successful:", data);

      // Auto-login dopo registrazione (senza aspettare email confirmation)
      if (data.user) {
        console.log("Auto-logging in after registration...");
        await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
      }

      toast({
        title: "Registrazione completata",
        description: `Benvenuto in Tower Hybrid, ${formData.firstName || formData.email}!`
      });
      setShowPermissions(true);
    } catch (error: any) {
      console.error("Registration failed:", error);
      
      // Se il login automatico fallisce per email non confermata, suggerisci di controllare email
      if (error.message?.includes("Email not confirmed")) {
        toast({
          title: "Email non confermata",
          description: "Controlla la tua email e clicca il link di conferma per attivare l'account",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Errore di registrazione",
          description: error.message || "Errore durante la registrazione",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === "register") {
      handleRegister();
    } else {
      handleLogin();
    }
  };

  const handleOAuthLogin = async (provider: 'google' | 'github' | 'discord') => {
    try {
      setIsLoading(true);
      console.log(`Attempting ${provider} login...`);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        console.error(`${provider} login error:`, error);
        throw error;
      }
    } catch (error: any) {
      console.error(`${provider} login failed:`, error);
      toast({
        title: `Errore con ${provider}`,
        description: error.message || `Login con ${provider} non disponibile`,
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  if (showPermissions) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden p-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-black to-black" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-fuchsia-500 to-transparent opacity-50" />

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="z-10 w-full max-w-md space-y-6"
        >
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-display font-black text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-fuchsia-500">
              PERMESSI
            </h1>
            <p className="text-cyan-500/80 font-mono tracking-[0.2em] text-xs uppercase">
              Per un'esperienza di gioco completa
            </p>
          </div>

          <div className="p-4 rounded border border-gray-800 bg-gray-900/50 space-y-4">
            <p className="text-gray-400 text-sm text-center">
              Tower Hybrid utilizza fotocamera e GPS per funzioni di gioco avanzate.
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded bg-gray-800/50 border border-gray-700">
                <div className="flex items-center gap-3">
                  <Camera className="w-5 h-5 text-cyan-400" />
                  <div>
                    <p className="text-white text-sm font-medium">Fotocamera</p>
                    <p className="text-gray-500 text-xs">Per scansione QR e AR</p>
                  </div>
                </div>
                {permissionsGranted.camera ? (
                  <Check className="w-5 h-5 text-green-400" />
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={requestCameraPermission}
                    className="border-cyan-500/50 text-cyan-400"
                  >
                    Autorizza
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded bg-gray-800/50 border border-gray-700">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-fuchsia-400" />
                  <div>
                    <p className="text-white text-sm font-medium">Localizzazione</p>
                    <p className="text-gray-500 text-xs">Per tracking gameplay</p>
                  </div>
                </div>
                {permissionsGranted.location ? (
                  <Check className="w-5 h-5 text-green-400" />
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={requestLocationPermission}
                    className="border-fuchsia-500/50 text-fuchsia-400"
                  >
                    Autorizza
                  </Button>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="ghost"
                className="flex-1 text-gray-400"
                onClick={handlePermissionsComplete}
              >
                Salta
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white"
                onClick={handlePermissionsComplete}
                disabled={isLoading}
              >
                <Check className="w-4 h-4 mr-2" />
                Continua
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-black to-black" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-fuchsia-500 to-transparent opacity-50" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="z-10 w-full max-w-md space-y-6"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/")}
          className="text-gray-400 hover:text-cyan-400"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Torna alla Home
        </Button>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-display font-black text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-fuchsia-500">
            TOWER HYBRID
          </h1>
          <p className="text-cyan-500/80 font-mono tracking-[0.2em] text-xs uppercase">
            {mode === "login" ? "Accedi al tuo account" : "Crea il tuo account"}
          </p>
        </div>

        {mode === "login" && (
          <div className="p-3 rounded border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 text-sm text-center">
            ⚠️ Prima accesso? Usa <strong>"Registrati"</strong> per creare un account
          </div>
        )}

        <div className="flex gap-2 p-1 bg-gray-900/50 rounded border border-gray-800">
          <button
            onClick={() => { setMode("login"); setFormData({ email: "", password: "", confirmPassword: "", firstName: "", lastName: "" }); }}
            className={`flex-1 py-2 px-4 rounded text-sm font-medium transition-all ${
              mode === "login"
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/50"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            <LogIn className="w-4 h-4 inline mr-2" />
            Accedi
          </button>
          <button
            onClick={() => { setMode("register"); setFormData({ email: "", password: "", confirmPassword: "", firstName: "", lastName: "" }); }}
            className={`flex-1 py-2 px-4 rounded text-sm font-medium transition-all ${
              mode === "register"
                ? "bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/50"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            <UserPlus className="w-4 h-4 inline mr-2" />
            Registrati
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-4 rounded border border-gray-800 bg-gray-900/50">
          {mode === "register" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-gray-400 text-xs">Nome</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Mario"
                  className="bg-black/50 border-gray-700 text-white placeholder:text-gray-600"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-gray-400 text-xs">Cognome</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Rossi"
                  className="bg-black/50 border-gray-700 text-white placeholder:text-gray-600"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-400 text-xs">Email *</Label>
            <Input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@esempio.com"
              className="bg-black/50 border-gray-700 text-white placeholder:text-gray-600"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-400 text-xs">Password *</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Inserisci password"
                className="bg-black/50 border-gray-700 text-white placeholder:text-gray-600 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {mode === "register" && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-400 text-xs">Conferma Password *</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Ripeti password"
                className="bg-black/50 border-gray-700 text-white placeholder:text-gray-600"
              />
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className={`w-full ${
              mode === "login"
                ? "bg-cyan-500 hover:bg-cyan-600 text-black"
                : "bg-fuchsia-500 hover:bg-fuchsia-600 text-white"
            }`}
          >
            {isLoading ? (
              <span className="animate-pulse">Caricamento...</span>
            ) : mode === "login" ? (
              <>
                <LogIn className="w-4 h-4 mr-2" />
                Accedi
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Registrati
              </>
            )}
          </Button>
        </form>

        <div className="space-y-3">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-black px-2 text-gray-500">Oppure</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              disabled={isLoading}
              onClick={() => handleOAuthLogin('google')}
              variant="outline"
              className="border-gray-700 text-gray-400 hover:text-white hover:border-cyan-500"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span className="text-xs">Google</span>
            </Button>

            <Button
              type="button"
              disabled={isLoading}
              onClick={() => handleOAuthLogin('github')}
              variant="outline"
              className="border-gray-700 text-gray-400 hover:text-white hover:border-cyan-500"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span className="text-xs">GitHub</span>
            </Button>

            <Button
              type="button"
              disabled={isLoading}
              onClick={() => handleOAuthLogin('discord')}
              variant="outline"
              className="border-gray-700 text-gray-400 hover:text-white hover:border-cyan-500"
            >
              <svg className="w-4 h-4" viewBox="0 0 127.14 96.36" fill="currentColor">
                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A99.68,99.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0A105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a77.58,77.58,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.22,77,77,0,0,0,6.89,11.1A105.73,105.73,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60.55,31,54s5-11.75,11.45-11.75S54,47.45,54,54,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60.55,73.25,54s5-11.75,11.44-11.75S96.23,47.45,96.23,54,91.09,65.69,84.69,65.69Z"/>
              </svg>
              <span className="text-xs">Discord</span>
            </Button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500">
          {mode === "login" ? (
            <>Non hai un account? <button onClick={() => setMode("register")} className="text-fuchsia-400 hover:underline">Registrati</button></>
          ) : (
            <>Hai già un account? <button onClick={() => setMode("login")} className="text-cyan-400 hover:underline">Accedi</button></>
          )}
        </p>
      </motion.div>
    </div>
  );
}
