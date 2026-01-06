import { NeonButton } from "@/components/NeonButton";
import { useLocation, useSearch } from "wouter";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useHero } from "@/context/HeroContext";
import { QrCode, ArrowLeft, Scan, CheckCircle, AlertCircle, Users, Crown, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase, type GameSessionRow } from "@/lib/supabaseClient";
import QRCode from 'qrcode';

type SessionMode = 'choose' | 'host' | 'join' | 'hosting';
type JoinStatus = 'idle' | 'joining' | 'success' | 'error';

export default function TabletopSession() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const { loadLastSession, setGameMode, playerState } = useHero();
  const { toast } = useToast();
  
  const [mode, setMode] = useState<SessionMode>('choose');
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joinStatus, setJoinStatus] = useState<JoinStatus>('idle');
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [gameSession, setGameSession] = useState<GameSessionRow | null>(null);
  const [connectedPlayers, setConnectedPlayers] = useState<any[]>([]);
  const [hostUserId, setHostUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [channelRef, setChannelRef] = useState<any>(null);

  // Check for join parameter in URL
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const joinParam = params.get('join');
    if (joinParam) {
      setMode('join');
      setJoinCode(joinParam);
    }
  }, [searchString]);

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (channelRef) {
        channelRef.unsubscribe();
      }
    };
  }, [channelRef]);

  // Generate unique room code
  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleHostSession = async () => {
    if (!playerState?.heroId) {
      toast({
        title: 'Errore',
        description: 'Eroe non trovato. Torna alla selezione.',
        variant: 'destructive'
      });
      return;
    }

    setMode('host');
    setIsLoading(true);
    
    try {
      // Get current authenticated user for host_id
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Non autenticato. Torna al login.');
      }

      // Generate unique room code
      const newRoomCode = generateRoomCode();

      // Prepare hero data to send to other players
      const currentHero = {
        id: playerState.heroId,
        name: playerState.heroName || 'Host',
        class: playerState.heroClass || 'DPS',
        maxHp: playerState.maxHP || 12,
        maxR2: playerState.maxR2 || 4,
      };

      // Insert new game session into Supabase
      const { data: roomData, error: insertError } = await supabase
        .from('game_sessions')
        .insert({
          room_code: newRoomCode,
          host_id: user.id,
          status: 'lobby',
          players: [currentHero],
          current_floor: 0,
          node_counter: 0,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Generate QR code URL pointing to join endpoint
      const joinUrl = `${window.location.origin}/tabletop?join=${newRoomCode}`;
      const qrDataUrl = await QRCode.toDataURL(joinUrl);

      // Update local state
      setRoomCode(newRoomCode);
      setQrCodeUrl(qrDataUrl);
      setGameSession(roomData);
      setConnectedPlayers([currentHero]);
      setHostUserId(user.id);
      setGameMode('tabletop');
      loadLastSession();

      // Subscribe to real-time updates on this room
      const channel = supabase
        .channel(`game_room:${newRoomCode}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'game_sessions',
            filter: `room_code=eq.${newRoomCode}`,
          },
          (payload: any) => {
            console.log('Realtime update:', payload);
            if (payload.new) {
              const newSession = payload.new as GameSessionRow;
              setGameSession(newSession);
              if (newSession.players) {
                setConnectedPlayers(newSession.players as any[]);
              }
              // If status changed to tactical, go to tactical dashboard
              if (newSession.status === 'tactical') {
                sessionStorage.setItem('currentRoomCode', newRoomCode);
                setLocation('/tactical');
              }
            }
          }
        )
        .subscribe();

      setChannelRef(channel);
      setMode('hosting');

      toast({
        title: 'Stanza creata!',
        description: `Codice stanza: ${newRoomCode}. Condividi il QR con gli altri giocatori.`,
      });
    } catch (error) {
      console.error('Host session error:', error);
      toast({
        title: 'Errore',
        description: error instanceof Error ? error.message : 'Impossibile creare la stanza',
        variant: 'destructive'
      });
      setMode('choose');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinSession = async () => {
    if (!joinCode.trim()) {
      toast({
        title: 'Codice mancante',
        description: 'Inserisci il codice della stanza',
        variant: 'destructive'
      });
      return;
    }

    if (!playerState?.heroId) {
      toast({
        title: 'Errore',
        description: 'Eroe non trovato. Torna alla selezione.',
        variant: 'destructive'
      });
      return;
    }

    setJoinStatus('joining');
    
    try {
      // Get current authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Non autenticato. Torna al login.');
      }

      // Fetch the room by code
      const { data: roomData, error: fetchError } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('room_code', joinCode.toUpperCase())
        .single();

      if (fetchError || !roomData) {
        throw new Error('Stanza non trovata');
      }

      // Prepare current hero data
      const currentHero = {
        id: playerState.heroId,
        name: playerState.heroName || 'Player',
        class: playerState.heroClass || 'DPS',
        maxHp: playerState.maxHP || 12,
        maxR2: playerState.maxR2 || 4,
      };

      // Add current hero to players array
      const updatedPlayers = Array.isArray(roomData.players) 
        ? [...roomData.players, currentHero]
        : [currentHero];

      // Update game session with new player
      const { data: updatedRoom, error: updateError } = await supabase
        .from('game_sessions')
        .update({ players: updatedPlayers })
        .eq('room_code', joinCode.toUpperCase())
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setRoomCode(joinCode.toUpperCase());
      setGameSession(updatedRoom);
      setConnectedPlayers(updatedPlayers);
      setHostUserId(roomData.host_id);
      setGameMode('tabletop');
      loadLastSession();

      // Subscribe to real-time updates
      const channel = supabase
        .channel(`game_room:${joinCode.toUpperCase()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'game_sessions',
            filter: `room_code=eq.${joinCode.toUpperCase()}`,
          },
          (payload: any) => {
            console.log('Realtime update:', payload);
            if (payload.new) {
              const newSession = payload.new as GameSessionRow;
              setGameSession(newSession);
              if (newSession.players) {
                setConnectedPlayers(newSession.players as any[]);
              }
              // If status changed to tactical (host started game), navigate to tactical dashboard
              if (newSession.status === 'tactical') {
                sessionStorage.setItem('currentRoomCode', joinCode.toUpperCase());
                setLocation('/tactical');
              }
            }
          }
        )
        .subscribe();

      setChannelRef(channel);
      setJoinStatus('success');
      toast({
        title: 'Connesso!',
        description: `Stanza ${joinCode.toUpperCase()} - In attesa dell'host`,
      });
    } catch (error) {
      console.error('Join session error:', error);
      setJoinStatus('error');
      toast({
        title: 'Errore',
        description: error instanceof Error ? error.message : 'Impossibile unirsi alla stanza',
        variant: 'destructive'
      });
    }
  };

  const handleEnterGame = async () => {
    // Save room code to session for RoomDashboard
    sessionStorage.setItem('currentRoomCode', roomCode);

    // If user is the host, update room status to 'tactical'
    if (gameSession && hostUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.id === hostUserId) {
        // Host is starting the game
        await supabase
          .from('game_sessions')
          .update({ status: 'tactical' })
          .eq('room_code', roomCode);
        // Host navigates to tactical dashboard
        setLocation('/tactical');
      }
    } else {
      // Client waits for status change via realtime (handled in useEffect)
      // The postgres_changes handler will redirect when status becomes 'tactical'
    }
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    toast({
      title: 'Copiato!',
      description: 'Codice stanza copiato negli appunti',
    });
  };

  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-fuchsia-900/20 via-black to-black" />

      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => mode === 'choose' ? setLocation("/") : setMode('choose')}
        className="z-20 flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors mb-4"
        data-testid="button-back"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-display text-sm uppercase">
          {mode === 'choose' ? 'Menu' : 'Indietro'}
        </span>
      </motion.button>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="z-10 w-full max-w-md mx-auto space-y-6 flex-1 flex flex-col items-center justify-center"
      >
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-display font-black text-transparent bg-clip-text bg-gradient-to-br from-fuchsia-400 to-cyan-500">
            SESSIONE DA TAVOLO
          </h1>
          <p className="text-fuchsia-500/80 font-mono tracking-[0.2em] text-xs uppercase">
            {mode === 'choose' && 'Scegli come partecipare'}
            {mode === 'host' && 'Condividi il QR con i giocatori'}
            {mode === 'join' && 'Inserisci il codice della stanza'}
          </p>
        </div>

        {mode === 'choose' && (
          <div className="w-full space-y-4">
            <NeonButton 
              size="lg" 
              className="w-full h-20 gap-3"
              onClick={handleHostSession}
              data-testid="button-host-session"
            >
              <Crown className="w-6 h-6" />
              <div className="flex flex-col items-start">
                <span className="font-display font-bold">CREA STANZA</span>
                <span className="text-[10px] text-cyan-300/60 font-mono">Genera QR per invitare</span>
              </div>
            </NeonButton>

            <NeonButton 
              size="lg" 
              variant="secondary"
              className="w-full h-20 gap-3"
              onClick={() => setMode('join')}
              data-testid="button-join-session"
            >
              <Users className="w-6 h-6" />
              <div className="flex flex-col items-start">
                <span className="font-display font-bold">UNISCITI</span>
                <span className="text-[10px] text-fuchsia-300/60 font-mono">Inserisci codice stanza</span>
              </div>
            </NeonButton>
          </div>
        )}

        {mode === 'host' && (
          <div className="w-full space-y-4">
            <div className="w-64 h-64 mx-auto rounded-xl border-2 border-cyan-500/50 bg-cyan-500/5 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-cyan-400 text-sm font-mono">Creazione stanza...</p>
              </div>
            </div>
          </div>
        )}

        {mode === 'hosting' && qrCodeUrl && (
          <div className="w-full space-y-4">
            <div className="w-64 h-64 mx-auto rounded-xl border-2 border-cyan-500 bg-black p-2">
              <img src={qrCodeUrl} alt="Room QR Code" className="w-full h-full" />
            </div>
            
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl font-display font-bold text-cyan-400 tracking-widest">
                {roomCode}
              </span>
              <Button
                size="icon"
                variant="ghost"
                onClick={copyRoomCode}
                className="text-cyan-400"
                data-testid="button-copy-code"
              >
                <Copy className="w-5 h-5" />
              </Button>
            </div>

            {connectedPlayers.length > 0 && (
              <div className="bg-fuchsia-900/30 rounded-lg border border-fuchsia-500/30 p-3">
                <p className="text-xs text-fuchsia-300 font-mono mb-2">GIOCATORI COLLEGATI:</p>
                <div className="space-y-1">
                  {connectedPlayers.map((player: any, idx: number) => (
                    <div key={idx} className="text-sm text-cyan-400 font-display">
                      {player.name} ({player.class})
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-gray-500 text-center font-mono">
              I giocatori possono scansionare il QR o inserire il codice
            </p>

            <NeonButton 
              size="lg" 
              className="w-full"
              onClick={handleEnterGame}
              data-testid="button-start-game"
            >
              INIZIA PARTITA
            </NeonButton>
          </div>
        )}

        {mode === 'join' && (
          <div className="w-full space-y-4">
            <div className={cn(
              "w-64 h-64 mx-auto rounded-xl border-2 flex items-center justify-center",
              joinStatus === 'idle' && "border-fuchsia-500/50 bg-fuchsia-500/5",
              joinStatus === 'joining' && "border-fuchsia-500 bg-fuchsia-500/10 animate-pulse",
              joinStatus === 'success' && "border-green-500 bg-green-500/10",
              joinStatus === 'error' && "border-red-500 bg-red-500/10"
            )}>
              {joinStatus === 'idle' && (
                <div className="text-center p-4 w-full">
                  <QrCode className="w-12 h-12 mx-auto mb-4 text-fuchsia-400 opacity-50" />
                  <Input
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="CODICE"
                    className="text-center text-2xl font-display tracking-widest bg-transparent border-fuchsia-500/50 text-fuchsia-400"
                    maxLength={8}
                    data-testid="input-room-code"
                  />
                </div>
              )}

              {joinStatus === 'joining' && (
                <div className="text-center text-fuchsia-400">
                  <Scan className="w-16 h-16 mx-auto mb-2 animate-bounce" />
                  <p className="text-xs font-mono animate-pulse">Connessione...</p>
                </div>
              )}

              {joinStatus === 'success' && (
                <div className="text-center text-green-400">
                  <CheckCircle className="w-16 h-16 mx-auto mb-2" />
                  <p className="text-xs font-mono">Connesso!</p>
                  <p className="text-lg font-display font-bold mt-2">{roomCode}</p>
                </div>
              )}

              {joinStatus === 'error' && (
                <div className="text-center text-red-400">
                  <AlertCircle className="w-16 h-16 mx-auto mb-2" />
                  <p className="text-xs font-mono">Stanza non trovata</p>
                </div>
              )}
            </div>

            {joinStatus === 'idle' && (
              <NeonButton 
                size="lg" 
                variant="secondary"
                className="w-full"
                onClick={handleJoinSession}
                disabled={!joinCode.trim()}
                data-testid="button-join-room"
              >
                <Users className="w-5 h-5 mr-2" />
                UNISCITI ALLA STANZA
              </NeonButton>
            )}

            {joinStatus === 'success' && (
              <NeonButton 
                size="lg" 
                className="w-full"
                onClick={handleEnterGame}
                data-testid="button-enter-game"
              >
                ENTRA IN SESSIONE
              </NeonButton>
            )}

            {joinStatus === 'error' && (
              <NeonButton 
                size="lg" 
                variant="secondary"
                className="w-full"
                onClick={() => setJoinStatus('idle')}
              >
                RIPROVA
              </NeonButton>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
