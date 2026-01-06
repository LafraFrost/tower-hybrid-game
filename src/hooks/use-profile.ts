import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

// === PROFILE ===
export function useProfile() {
  return useQuery({
    queryKey: [api.me.get.path],
    queryFn: async () => {
      const res = await fetch(api.me.get.path, { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch profile");
      return api.me.get.responses[200].parse(await res.json());
    },
  });
}

// === DAILY QUESTS ===
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
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (questId: number) => {
      const url = buildUrl(api.quests.complete.path, { id: questId });
      const res = await fetch(url, {
        method: api.quests.complete.method,
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to complete quest");
      return api.quests.complete.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      toast({
        title: "Quest Completed!",
        description: `Gained ${data.rewardXp} XP + ${data.rewardStatValue} ${data.rewardStatType}`,
        className: "border-green-500 text-green-500 bg-black/90",
      });
      queryClient.invalidateQueries({ queryKey: [api.quests.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.me.get.path] });
    },
  });
}
