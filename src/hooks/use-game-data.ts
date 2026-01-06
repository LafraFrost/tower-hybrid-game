import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { 
  User, 
  DailyQuest, 
  Game, 
  Unit, 
  Card,
  GameStateResponse,
  CompleteQuestRequest,
  MoveUnitRequest,
  PlayCardRequest
} from "@shared/schema";

// === USER / PROFILE HOOKS ===

export function useMe() {
  return useQuery({
    queryKey: [api.me.get.path],
    queryFn: async () => {
      const res = await fetch(api.me.get.path, { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch user");
      return api.me.get.responses[200].parse(await res.json());
    },
  });
}

// === DAILY QUESTS HOOKS ===

export function useDailyQuests() {
  return useQuery({
    queryKey: [api.quests.list.path],
    queryFn: async () => {
      const res = await fetch(api.quests.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch quests");
      return api.quests.list.responses[200].parse(await res.json());
    },
  });
}

export function useCompleteQuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ questId }: CompleteQuestRequest) => {
      const url = buildUrl(api.quests.complete.path, { id: questId });
      const res = await fetch(url, {
        method: "POST",
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to complete quest");
      return api.quests.complete.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.quests.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.me.get.path] }); // Refresh user stats
    },
  });
}

// === GAME & MAP HOOKS ===

export function useGameState(gameId: number) {
  return useQuery({
    queryKey: [api.game.sync.path, gameId],
    queryFn: async () => {
      const url = buildUrl(api.game.sync.path, { id: gameId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch game state");
      return api.game.sync.responses[200].parse(await res.json());
    },
    refetchInterval: 3000, // Poll every 3 seconds for sync
  });
}

// === UNIT ACTIONS ===

export function useMoveUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ unitId, x, y }: MoveUnitRequest) => {
      const url = buildUrl(api.units.move.path, { id: unitId });
      const res = await fetch(url, {
        method: api.units.move.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ x, y }),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = await res.json();
          throw new Error(error.message || "Invalid move");
        }
        throw new Error("Failed to move unit");
      }
      return api.units.move.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      // We don't have gameId in variables directly, but we can invalidate all game queries or precise ones if we passed gameId
      queryClient.invalidateQueries({ queryKey: [api.game.sync.path] });
    },
  });
}

// === CARD ACTIONS ===

export function useHand(gameId: number) {
  return useQuery({
    queryKey: [api.cards.list.path, gameId],
    queryFn: async () => {
      const url = buildUrl(api.cards.list.path, { gameId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch hand");
      return api.cards.list.responses[200].parse(await res.json());
    },
  });
}

export function usePlayCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ cardId, targetUnitId }: PlayCardRequest) => {
      const url = buildUrl(api.cards.play.path, { id: cardId });
      const res = await fetch(url, {
        method: api.cards.play.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUnitId }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to play card");
      return api.cards.play.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.cards.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.game.sync.path] });
    },
  });
}
