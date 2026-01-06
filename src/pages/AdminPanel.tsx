import { useState } from "react";
import { useCustomAuth } from "@/hooks/use-custom-auth-supabase";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Redirect, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Shield, Users, Mail, Calendar, Clock, MapPin, Camera, Navigation, DoorOpen, RotateCcw, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import TrackingMap from "@/components/TrackingMap";
import { useToast } from "@/hooks/use-toast";

interface CustomUserDisplay {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  isAdmin: boolean;
  cameraPermission: boolean;
  locationPermission: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

interface LocationData {
  id: number;
  userId: number;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  sessionType: string | null;
  createdAt: string;
  userEmail: string;
  userName: string;
}

interface RoomData {
  id: number;
  roomCode: string;
  hostHeroSessionId: number;
  status: string;
  currentAction: string | null;
  nodeCounter: number;
  currentFloor: number;
  createdAt: string;
  playerCount: number;
}

type TabType = 'users' | 'tracking' | 'rooms';

export default function AdminPanel() {
  const { user, isLoading: authLoading, isAdmin } = useCustomAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const { toast } = useToast();

  const usersQuery = useQuery<CustomUserDisplay[]>({
    queryKey: ['/api/admin/custom-users'],
    enabled: isAdmin
  });

  const locationsQuery = useQuery<LocationData[]>({
    queryKey: ['/api/admin/locations'],
    enabled: isAdmin && activeTab === 'tracking'
  });

  const roomsQuery = useQuery<RoomData[]>({
    queryKey: ['/api/admin/rooms'],
    enabled: isAdmin && activeTab === 'rooms'
  });

  const resetRoomMutation = useMutation({
    mutationFn: async (roomId: number) => {
      return await apiRequest('POST', `/api/admin/rooms/${roomId}/reset`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/rooms'] });
      toast({
        title: "Stanza resettata",
        description: "HP, PA e R2 ripristinati. Nemici eliminati.",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile resettare la stanza.",
        variant: "destructive",
      });
    }
  });

  const killRoomMutation = useMutation({
    mutationFn: async (roomId: number) => {
      return await apiRequest('DELETE', `/api/admin/rooms/${roomId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/rooms'] });
      toast({
        title: "Stanza eliminata",
        description: "La stanza è stata chiusa e i client disconnessi.",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile eliminare la stanza.",
        variant: "destructive",
      });
    }
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Redirect to="/" />;
  }

  const users = usersQuery.data || [];
  const locations = locationsQuery.data || [];
  const rooms = roomsQuery.data || [];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-fuchsia-900/10 via-black to-black pointer-events-none" />
      
      <div className="relative z-20 flex items-center justify-between p-3 border-b border-fuchsia-500/30 bg-black/80 backdrop-blur">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation('/')}
          className="text-fuchsia-400 hover:text-fuchsia-300 gap-1"
          data-testid="button-back-admin"
        >
          <ChevronLeft className="w-4 h-4" />
          BACK
        </Button>
        <div className="text-center flex items-center gap-2">
          <Shield className="w-4 h-4 text-fuchsia-400" />
          <h1 className="text-sm font-display text-fuchsia-400 uppercase tracking-wider">Admin Panel</h1>
        </div>
        <div className="w-16" />
      </div>

      <div className="relative z-10 flex gap-2 p-3 border-b border-gray-800">
        <Button
          variant={activeTab === 'users' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('users')}
          className={activeTab === 'users' ? 'bg-cyan-500 text-black' : 'text-gray-400'}
          data-testid="tab-users"
        >
          <Users className="w-4 h-4 mr-2" />
          Utenti
        </Button>
        <Button
          variant={activeTab === 'tracking' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('tracking')}
          className={activeTab === 'tracking' ? 'bg-fuchsia-500 text-white' : 'text-gray-400'}
          data-testid="tab-tracking"
        >
          <MapPin className="w-4 h-4 mr-2" />
          Tracking GPS
        </Button>
        <Button
          variant={activeTab === 'rooms' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('rooms')}
          className={activeTab === 'rooms' ? 'bg-yellow-500 text-black' : 'text-gray-400'}
          data-testid="tab-rooms"
        >
          <DoorOpen className="w-4 h-4 mr-2" />
          Stanze
        </Button>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {activeTab === 'users' && (
          <>
            <div className="mb-6 p-4 rounded border border-fuchsia-500/30 bg-fuchsia-500/10">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-fuchsia-400" />
                <h2 className="text-lg font-display text-fuchsia-400 uppercase">Utenti Registrati</h2>
              </div>
              <p className="text-sm text-gray-400">
                Totale: <span className="text-fuchsia-300 font-bold">{users.length}</span> utenti
              </p>
            </div>

            {usersQuery.isLoading ? (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <p>Nessun utente registrato</p>
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((customUser) => (
                  <div 
                    key={customUser.id}
                    className="p-4 rounded border border-cyan-500/30 bg-black/60 backdrop-blur"
                    data-testid={`user-card-${customUser.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full border-2 border-cyan-500 bg-gradient-to-br from-cyan-500/30 to-fuchsia-500/30 flex items-center justify-center">
                        <span className="text-lg font-bold text-white">
                          {(customUser.firstName?.[0] || customUser.email[0]).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-display text-cyan-400">
                            {customUser.firstName || ''} {customUser.lastName || ''}
                          </span>
                          {customUser.isAdmin && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/50">
                              ADMIN
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-400 mb-2">
                          <Mail className="w-3 h-3" />
                          <span>{customUser.email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mb-2 flex-wrap">
                          <div className="flex items-center gap-1">
                            <Camera className={`w-3 h-3 ${customUser.cameraPermission ? 'text-green-400' : 'text-gray-600'}`} />
                            <span className={customUser.cameraPermission ? 'text-green-400' : ''}>
                              {customUser.cameraPermission ? 'Camera OK' : 'No Camera'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Navigation className={`w-3 h-3 ${customUser.locationPermission ? 'text-green-400' : 'text-gray-600'}`} />
                            <span className={customUser.locationPermission ? 'text-green-400' : ''}>
                              {customUser.locationPermission ? 'GPS OK' : 'No GPS'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>
                              Registrato: {customUser.createdAt ? format(new Date(customUser.createdAt), 'dd MMM yyyy HH:mm', { locale: it }) : 'N/A'}
                            </span>
                          </div>
                          {customUser.lastLoginAt && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>
                                Ultimo accesso: {format(new Date(customUser.lastLoginAt), 'dd MMM yyyy HH:mm', { locale: it })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-800 text-[10px] text-gray-600 font-mono">
                      ID: {customUser.id}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 p-4 rounded border border-green-500/30 bg-green-500/10">
              <p className="text-xs text-green-400">
                <strong>Sistema di sicurezza:</strong> Le password sono criptate con bcrypt e salvate nel database PostgreSQL.
                Nessuna password è visibile in chiaro, neanche per l'amministratore.
              </p>
            </div>
          </>
        )}

        {activeTab === 'tracking' && (
          <>
            <div className="mb-6 p-4 rounded border border-cyan-500/30 bg-cyan-500/10">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-display text-cyan-400 uppercase">Tracking GPS</h2>
              </div>
              <p className="text-sm text-gray-400">
                Ultime <span className="text-cyan-300 font-bold">{locations.length}</span> posizioni registrate
              </p>
            </div>

            <div className="mb-6">
              <TrackingMap locations={locations} />
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-cyan-500 shadow-[0_0_8px_#06B6D4]" />
                  <span>Idle</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_8px_#FACC15]" />
                  <span>Solo</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-fuchsia-500 shadow-[0_0_8px_#D946EF]" />
                  <span>Tabletop</span>
                </div>
              </div>
            </div>

            {locationsQuery.isLoading ? (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : locations.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <MapPin className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Nessuna posizione registrata</p>
                <p className="text-xs mt-2">Le posizioni verranno salvate quando gli utenti accedono con GPS abilitato</p>
              </div>
            ) : (
              <div className="space-y-3">
                {locations.map((loc) => (
                  <div 
                    key={loc.id}
                    className="p-4 rounded border border-cyan-500/30 bg-black/60 backdrop-blur"
                    data-testid={`location-card-${loc.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full border-2 border-cyan-500 bg-cyan-500/20 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-display text-cyan-400">
                            {loc.userName}
                          </span>
                          {loc.sessionType && (
                            <span className={`text-[10px] px-2 py-0.5 rounded border ${
                              loc.sessionType === 'solo' 
                                ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                                : loc.sessionType === 'tabletop'
                                ? 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/50'
                                : 'bg-gray-500/20 text-gray-400 border-gray-500/50'
                            }`}>
                              {loc.sessionType.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 mb-2">
                          {loc.userEmail}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2 rounded bg-gray-800/50">
                            <span className="text-gray-500">Lat:</span>
                            <span className="text-cyan-300 ml-1 font-mono">{loc.latitude.toFixed(6)}</span>
                          </div>
                          <div className="p-2 rounded bg-gray-800/50">
                            <span className="text-gray-500">Lng:</span>
                            <span className="text-cyan-300 ml-1 font-mono">{loc.longitude.toFixed(6)}</span>
                          </div>
                        </div>
                        {loc.accuracy && (
                          <div className="mt-2 text-xs text-gray-500">
                            Precisione: <span className="text-gray-400">{loc.accuracy.toFixed(1)}m</span>
                          </div>
                        )}
                        <div className="mt-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {format(new Date(loc.createdAt), 'dd MMM yyyy HH:mm:ss', { locale: it })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 p-4 rounded border border-yellow-500/30 bg-yellow-500/10">
              <p className="text-xs text-yellow-400">
                <strong>Privacy:</strong> I dati di posizione sono salvati solo per utenti che hanno autorizzato il GPS.
                In futuro potrai usare questi dati per missioni basate sulla posizione.
              </p>
            </div>
          </>
        )}

        {activeTab === 'rooms' && (
          <>
            <div className="mb-6 p-4 rounded border border-yellow-500/30 bg-yellow-500/10">
              <div className="flex items-center gap-2 mb-2">
                <DoorOpen className="w-5 h-5 text-yellow-400" />
                <h2 className="text-lg font-display text-yellow-400 uppercase">Gestione Stanze</h2>
              </div>
              <p className="text-sm text-gray-400">
                Stanze attive: <span className="text-yellow-300 font-bold">{rooms.length}</span>
              </p>
            </div>

            {roomsQuery.isLoading ? (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : rooms.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <DoorOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Nessuna stanza attiva</p>
                <p className="text-xs mt-2">Le stanze appariranno quando i giocatori creeranno sessioni multiplayer</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rooms.map((room) => (
                  <div 
                    key={room.id}
                    className="p-4 rounded border border-yellow-500/30 bg-black/60 backdrop-blur"
                    data-testid={`room-card-${room.id}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="font-display text-yellow-400 text-lg">
                            {room.roomCode}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded border ${
                            room.status === 'LOBBY' 
                              ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50'
                              : room.status === 'COMBAT' || room.status === 'TACTICAL'
                              ? 'bg-red-500/20 text-red-400 border-red-500/50'
                              : 'bg-gray-500/20 text-gray-400 border-gray-500/50'
                          }`}>
                            {room.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                          <div className="p-2 rounded bg-gray-800/50">
                            <span className="text-gray-500">Giocatori:</span>
                            <span className="text-yellow-300 ml-1 font-bold">{room.playerCount}</span>
                          </div>
                          <div className="p-2 rounded bg-gray-800/50">
                            <span className="text-gray-500">Floor:</span>
                            <span className="text-cyan-300 ml-1">{room.currentFloor}</span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          <Clock className="w-3 h-3 inline mr-1" />
                          Creata: {format(new Date(room.createdAt), 'dd MMM yyyy HH:mm', { locale: it })}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resetRoomMutation.mutate(room.id)}
                          disabled={resetRoomMutation.isPending}
                          className="border-cyan-500/50 text-cyan-400 gap-1"
                          data-testid={`button-reset-room-${room.id}`}
                        >
                          <RotateCcw className="w-3 h-3" />
                          Reset
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (confirm(`Sei sicuro di voler eliminare la stanza ${room.roomCode}? Tutti i client verranno disconnessi.`)) {
                              killRoomMutation.mutate(room.id);
                            }
                          }}
                          disabled={killRoomMutation.isPending}
                          className="border-red-500/50 text-red-400 gap-1"
                          data-testid={`button-kill-room-${room.id}`}
                        >
                          <Trash2 className="w-3 h-3" />
                          Kill
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-800 text-[10px] text-gray-600 font-mono">
                      ID: {room.id} | Host Session: {room.hostHeroSessionId}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 p-4 rounded border border-cyan-500/30 bg-cyan-500/10">
              <p className="text-xs text-cyan-400">
                <strong>Reset:</strong> Ripristina HP, PA e R2 di tutti i giocatori ai valori base e rimuove tutti i nemici.
                I client connessi riceveranno un evento per aggiornare i dati.
              </p>
            </div>
            <div className="mt-3 p-4 rounded border border-red-500/30 bg-red-500/10">
              <p className="text-xs text-red-400">
                <strong>Kill Room:</strong> Elimina definitivamente la stanza e disconnette tutti i socket. Azione irreversibile.
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
