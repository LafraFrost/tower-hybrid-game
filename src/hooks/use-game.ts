import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

// === GAME STATE ===
export function useGameState(gameId: number) {
  return useQuery({
    queryKey: [api.game.sync.path, gameId],
    queryFn: async () => {
      const url = buildUrl(api.game.sync.path, { id: gameId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch game state");
      return api.game.sync.responses[200].parse(await res.json());
    },
    refetchInterval: 1000, // Poll every second for multi-device sync
  });
}

// === UNIT ACTIONS ===
export function useMoveUnit() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ unitId, x, y }: { unitId: number; x: number; y: number }) => {
      const url = buildUrl(api.units.move.path, { id: unitId });
      const res = await fetch(url, {
        method: api.units.move.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ x, y }),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.units.move.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to move unit");
      }
      return api.units.move.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      toast({
        title: "Unit Moved",
        description: `Position updated to [${data.x}, ${data.y}]`,
        className: "border-primary text-primary bg-black/90",
      });
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [api.game.sync.path] });
    },
    onError: (error) => {
      toast({
        title: "Move Failed",
        description: error.message,
        variant: "destructive",
      });
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
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ cardId, targetUnitId }: { cardId: number; targetUnitId?: number }) => {
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
      toast({
        title: "Card Played",
        className: "border-secondary text-secondary bg-black/90",
      });
      queryClient.invalidateQueries({ queryKey: [api.cards.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.game.sync.path] });
    },
    onError: (error) => {
      toast({
        title: "Action Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
