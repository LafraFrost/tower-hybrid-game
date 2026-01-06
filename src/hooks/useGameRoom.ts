import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, type GameSessionRow, type SupabasePresenceUser } from '@/lib/supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';

type GameStatus = 'lobby' | 'combat' | 'rest' | 'tactical';

export interface RoomHero {
  heroSessionId: number;
  heroName: string;
  currentHp: number;
  maxHp: number;
  characterClass: string;
  userId?: string;
}

export const useGameRoom = (roomCode: string | null) => {
  const [gameSession, setGameSession] = useState<GameSessionRow | null>(null);
  const [connectedPlayers, setConnectedPlayers] = useState<RoomHero[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Subscribe to room updates via Realtime
  useEffect(() => {
    if (!roomCode) return;

    setIsLoading(true);
    setError(null);

    const fetchSession = async () => {
      try {
        const { data, error: queryError } = await supabase
          .from('game_sessions')
          .select('*')
          .eq('room_code', roomCode)
          .single();

        if (queryError) throw queryError;
        setGameSession(data as GameSessionRow);

        // Sync players from JSONB
        if (data?.players && Array.isArray(data.players)) {
          setConnectedPlayers(data.players);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch room');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();

    // Subscribe to Realtime changes
    const channel = supabase
      .channel(`game_room:${roomCode}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_sessions',
          filter: `room_code=eq.${roomCode}`,
        },
        (payload) => {
          if (payload.new) {
            setGameSession(payload.new as GameSessionRow);
            if ((payload.new as any)?.players) {
              setConnectedPlayers((payload.new as any).players);
            }
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [roomCode]);

  const updateStatus = useCallback(async (newStatus: GameStatus) => {
    if (!roomCode) return;
    try {
      const { error } = await supabase
        .from('game_sessions')
        .update({ status: newStatus })
        .eq('room_code', roomCode);

      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  }, [roomCode]);

  const addPlayer = useCallback(async (player: RoomHero) => {
    if (!gameSession) return;

    try {
      const updatedPlayers = [...(gameSession.players || [])];
      const existingIdx = updatedPlayers.findIndex(
        (p) => p.heroSessionId === player.heroSessionId
      );

      if (existingIdx >= 0) {
        updatedPlayers[existingIdx] = player;
      } else {
        updatedPlayers.push(player);
      }

      const { error } = await supabase
        .from('game_sessions')
        .update({ players: updatedPlayers })
        .eq('room_code', roomCode);

      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add player');
    }
  }, [gameSession, roomCode]);

  return {
    gameSession,
    connectedPlayers,
    isLoading,
    error,
    updateStatus,
    addPlayer,
  };
};
