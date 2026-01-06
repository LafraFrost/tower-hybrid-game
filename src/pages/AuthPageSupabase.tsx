import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, LogIn, UserPlus, ArrowLeft, Camera, MapPin, Check } from "lucide-react";
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
          setPermissionsGranted(prev => ({ ...prev, location: true }));
          toast({ title: "Localizzazione autorizzata", description: "Permesso concesso" });
          localStorage.setItem('location_permission', 'true');
          localStorage.setItem('last_location', JSON.stringify({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          }));
          resolve(true);
        },
        () => {
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
