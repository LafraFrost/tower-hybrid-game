import { useState, useEffect } from "react";
import { useCustomAuth } from "@/hooks/use-custom-auth-supabase";
import { Redirect, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Shield, Users, MapPin, RefreshCw, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";

interface GPSLocation {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: string;
  created_at: string;
}

interface StoredLocation extends GPSLocation {
  email?: string;
  name?: string;
}

export default function AdminPanel() {
  const { user, isLoading: authLoading, isAdmin } = useCustomAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<'users' | 'tracking'>('users');
  const { toast } = useToast();
  const [storedLocations, setStoredLocations] = useState<StoredLocation[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');

  // Carica le location da Supabase con real-time
  useEffect(() => {
    loadLocations();
    
    // Subscribe to real-time changes (Supabase Realtime v2 API)
    const channel = supabase
      .channel('gps-locations-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gps_locations' },
        (payload) => {
          console.log('Real-time GPS update:', payload);
          loadLocations(); // Ricarica quando c'è un cambiamento
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadLocations = async () => {
    try {
      console.log('Loading GPS locations from Supabase...');
      const { data, error } = await supabase
        .from('gps_locations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading locations:', error);
        setDebugInfo(`Errore: ${error.message}`);
        return;
      }

      console.log('Loaded locations:', data);
      setStoredLocations(data as StoredLocation[]);
      setDebugInfo(`Caricate ${data?.length || 0} location dal database`);
    } catch (error) {
      console.error('Error loading locations:', error);
      setDebugInfo(`Errore: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadLocations();
      toast({
        title: "Aggiornato",
        description: "Posizioni ricaricate"
      });
    } finally {
      setRefreshing(false);
    }
  };

  const clearLocations = () => {
    if (window.confirm('Sei sicuro di voler eliminare la cronologia GPS?')) {
      supabase
        .from('gps_locations')
        .delete()
        .gte('created_at', '1900-01-01')
        .then(() => {
          setStoredLocations([]);
          setDebugInfo('Cronologia eliminata');
          toast({
            title: "Cronologia eliminata",
            description: "I dati GPS sono stati cancellati"
          });
        });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Se non autenticato o non admin, reindirizza
  if (!user || !isAdmin) {
    console.log('❌ Admin Panel: User not authenticated or not admin', { user: user?.email, isAdmin });
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-fuchsia-900/10 via-black to-black pointer-events-none" />
      
      {/* Header */}
      <div className="relative z-20 flex items-center justify-between p-4 border-b border-fuchsia-500/30 bg-black/80 backdrop-blur">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation('/')}
          className="text-fuchsia-400 hover:text-fuchsia-300"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Indietro
        </Button>
        <div className="text-center flex items-center gap-2">
          <Shield className="w-5 h-5 text-fuchsia-400" />
          <h1 className="text-lg font-display text-fuchsia-400 uppercase tracking-wider">Admin Panel</h1>
        </div>
        <div className="w-20" />
      </div>

      {/* Tabs */}
      <div className="relative z-10 flex gap-2 p-4 border-b border-gray-800 flex-wrap">
        <Button
          variant={activeTab === 'users' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('users')}
          className={activeTab === 'users' ? 'bg-cyan-500 text-black' : 'text-gray-400'}
        >
          <Users className="w-4 h-4 mr-2" />
          Utenti Online
        </Button>
        <Button
          variant={activeTab === 'tracking' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('tracking')}
          className={activeTab === 'tracking' ? 'bg-fuchsia-500 text-white' : 'text-gray-400'}
        >
          <MapPin className="w-4 h-4 mr-2" />
          Tracking GPS ({storedLocations.length})
        </Button>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 relative z-10">
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="p-4 rounded border border-cyan-500/30 bg-cyan-500/10">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-display text-cyan-400 uppercase">Utenti Registrati</h2>
              </div>
              <p className="text-sm text-gray-400">
                Email: <span className="text-cyan-300 font-mono">{user.email}</span>
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Ruolo: <span className="text-cyan-300 font-bold">ADMIN</span>
              </p>
              <p className="text-xs text-gray-500 mt-3">
                ℹ️ La lista utenti è temporaneamente in sviluppo. I dati verranno caricati da Supabase.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'tracking' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-fuchsia-400" />
                <h2 className="text-lg font-display text-fuchsia-400 uppercase">GPS Tracking</h2>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  variant="outline"
                  className="text-cyan-400 border-cyan-500/50"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Aggiorna
                </Button>
                {storedLocations.length > 0 && (
                  <Button
                    size="sm"
                    onClick={clearLocations}
                    variant="destructive"
                  >
                    Cancella
                  </Button>
                )}
              </div>
            </div>

            {/* Debug Info */}
            {debugInfo && (
              <div className="p-3 rounded border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs">
                <strong>Debug:</strong> {debugInfo}
              </div>
            )}

            {storedLocations.length === 0 ? (
              <div className="space-y-4">
                <div className="p-6 rounded border border-gray-700 bg-gray-900/50 text-center">
                  <MapPin className="w-12 h-12 text-gray-600 mx-auto mb-3 opacity-50" />
                  <p className="text-gray-400 mb-2">Nessuna posizione GPS registrata</p>
                  <p className="text-xs text-gray-500">
                    Le posizioni verranno salvate quando gli utenti loggati autorizzano il tracking GPS.
                  </p>
                </div>

                {/* Instructions */}
                <div className="p-4 rounded border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 text-sm space-y-2">
                  <div className="flex gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold mb-2">Per testare il tracking GPS:</p>
                      <ol className="list-decimal list-inside space-y-1 text-xs">
                        <li>Torna alla <strong>home</strong> (premi Indietro)</li>
                        <li>Clicca <strong>"Accedi"</strong> per login/registrazione</li>
                        <li>Autorizza il permesso <strong>GPS/Localizzazione</strong></li>
                        <li>Torna qui per visualizzare le coordinate</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                <div className="text-xs text-gray-400 mb-3">
                  Totale: <span className="text-cyan-400 font-bold">{storedLocations.length}</span> location
                </div>
                {storedLocations.map((loc) => (
                  <div
                    key={loc.id}
                    className="p-4 rounded border border-fuchsia-500/30 bg-fuchsia-500/5 hover:bg-fuchsia-500/10 transition"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-mono text-cyan-400 break-all">
                          📍 {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Precisione: ±{loc.accuracy ? Math.round(loc.accuracy) : '?'} m
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 whitespace-nowrap ml-2">
                        {new Date(loc.created_at).toLocaleTimeString('it-IT')}
                      </p>
                    </div>
                    <a
                      href={`https://maps.google.com/?q=${loc.latitude},${loc.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-fuchsia-400 hover:text-fuchsia-300 inline-block"
                    >
                      📎 Apri in Google Maps →
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
