import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, LogIn, UserPlus, ArrowLeft, Camera, MapPin, Check, X } from "lucide-react";

type AuthMode = "login" | "register" | "forgot";

interface AuthResponse {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isAdmin: boolean;
  cameraPermission: boolean;
  locationPermission: boolean;
}

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);
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

  const updatePermissionsMutation = useMutation({
    mutationFn: async (perms: { cameraPermission: boolean; locationPermission: boolean }) => {
      await apiRequest("PATCH", "/api/auth/permissions", perms);
    }
  });

  const requestCameraPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setPermissionsGranted(prev => ({ ...prev, camera: true }));
      toast({ title: "Fotocamera autorizzata", description: "Permesso concesso" });
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
          // Save initial location
          apiRequest("POST", "/api/location", {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            sessionType: "idle"
          });
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
    await updatePermissionsMutation.mutateAsync({
      cameraPermission: permissionsGranted.camera,
      locationPermission: permissionsGranted.location
    });
    setLocation("/");
  };

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json() as Promise<AuthResponse>;
    },
    onSuccess: (user) => {
      toast({
        title: "Accesso effettuato",
        description: `Benvenuto, ${user.firstName || user.email}!`
      });
      setPermissionsGranted({
        camera: user.cameraPermission,
        location: user.locationPermission
      });
      setShowPermissions(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Credenziali non valide",
        variant: "destructive"
      });
    }
  });

  const registerMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; firstName?: string; lastName?: string }) => {
      const response = await apiRequest("POST", "/api/auth/register", data);
      return response.json() as Promise<AuthResponse>;
    },
    onSuccess: (user) => {
      toast({
        title: "Registrazione completata",
        description: `Benvenuto in Tower Hybrid, ${user.firstName || user.email}!`
      });
      setPermissionsGranted({
        camera: user.cameraPermission,
        location: user.locationPermission
      });
      setShowPermissions(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante la registrazione",
        variant: "destructive"
      });
    }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest("POST", "/api/auth/reset-password", { email });
      return response.json() as Promise<{ message: string }>;
    },
    onSuccess: () => {
      toast({
        title: "Email inviata",
        description: "Controlla la tua email per il link di reset della password"
      });
      setMode("login");
      setFormData({ email: "", password: "", confirmPassword: "", firstName: "", lastName: "" });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante il reset della password",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === "forgot") {
      resetPasswordMutation.mutate(formData.email);
    } else if (mode === "register") {
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
      registerMutation.mutate({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined
      });
    } else {
      loginMutation.mutate({
        email: formData.email,
        password: formData.password
      });
    }
  };

  const isLoading = loginMutation.isPending || registerMutation.isPending || resetPasswordMutation.isPending;

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
                    data-testid="button-request-camera"
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
                    data-testid="button-request-location"
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
                data-testid="button-skip-permissions"
              >
                <X className="w-4 h-4 mr-2" />
                Salta
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white"
                onClick={handlePermissionsComplete}
                disabled={updatePermissionsMutation.isPending}
                data-testid="button-continue-permissions"
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
          data-testid="button-back-home"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Torna alla Home
        </Button>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-display font-black text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-fuchsia-500">
            TOWER HYBRID
          </h1>
          <p className="text-cyan-500/80 font-mono tracking-[0.2em] text-xs uppercase">
            {mode === "login" ? "Accedi al tuo account" : mode === "register" ? "Crea il tuo account" : "Recupera la tua password"}
          </p>
        </div>

        <div className="flex gap-2 p-1 bg-gray-900/50 rounded border border-gray-800">
          <button
            onClick={() => { setMode("login"); setFormData({ email: "", password: "", confirmPassword: "", firstName: "", lastName: "" }); }}
            className={`flex-1 py-2 px-4 rounded text-sm font-medium transition-all ${
              mode === "login"
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/50"
                : "text-gray-400 hover:text-gray-300"
            }`}
            data-testid="button-mode-login"
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
            data-testid="button-mode-register"
          >
            <UserPlus className="w-4 h-4 inline mr-2" />
            Registrati
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-4 rounded border border-gray-800 bg-gray-900/50">
          <AnimatePresence mode="wait">
            {mode === "register" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-2 gap-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-gray-400 text-xs">Nome</Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Mario"
                    className="bg-black/50 border-gray-700 text-white placeholder:text-gray-600"
                    data-testid="input-firstname"
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
                    data-testid="input-lastname"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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
              data-testid="input-email"
            />
          </div>

          {mode !== "forgot" && (
            <>
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
                    data-testid="input-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {mode === "register" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    <Label htmlFor="confirmPassword" className="text-gray-400 text-xs">Conferma Password *</Label>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      required={mode === "register"}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="Ripeti password"
                      className="bg-black/50 border-gray-700 text-white placeholder:text-gray-600"
                      data-testid="input-confirm-password"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className={`w-full ${
              mode === "login"
                ? "bg-cyan-500 hover:bg-cyan-600 text-black"
                : mode === "register"
                ? "bg-fuchsia-500 hover:bg-fuchsia-600 text-white"
                : "bg-amber-500 hover:bg-amber-600 text-white"
            }`}
            data-testid="button-submit-auth"
          >
            {isLoading ? (
              <span className="animate-pulse">Caricamento...</span>
            ) : mode === "login" ? (
              <>
                <LogIn className="w-4 h-4 mr-2" />
                Accedi
              </>
            ) : mode === "register" ? (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Registrati
              </>
            ) : (
              <>
                Invia Email di Reset
              </>
            )}
          </Button>
        </form>

        <p className="text-center text-xs text-gray-500">
          {mode === "login" && (
            <>
              Non hai un account? <button onClick={() => { setMode("register"); setFormData({ email: "", password: "", confirmPassword: "", firstName: "", lastName: "" }); }} className="text-fuchsia-400 hover:underline">Registrati</button>
              <br />
              <button onClick={() => { setMode("forgot"); setFormData({ email: "", password: "", confirmPassword: "", firstName: "", lastName: "" }); }} className="text-amber-400 hover:underline text-xs mt-2">Password dimenticata?</button>
            </>
          )}
          {mode === "register" && (
            <>Hai già un account? <button onClick={() => { setMode("login"); setFormData({ email: "", password: "", confirmPassword: "", firstName: "", lastName: "" }); }} className="text-cyan-400 hover:underline">Accedi</button></>
          )}
          {mode === "forgot" && (
            <>
              <button onClick={() => { setMode("login"); setFormData({ email: "", password: "", confirmPassword: "", firstName: "", lastName: "" }); }} className="text-cyan-400 hover:underline">Torna al login</button>
            </>
          )}
        </p>
      </motion.div>
    </div>
  );
}
