import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface CustomUser {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isAdmin: boolean;
}

async function fetchCustomUser(): Promise<CustomUser | null> {
  try {
    const response = await fetch("/api/auth/me", {
      credentials: "include",
    });

    if (response.status === 401) {
      return null;
    }

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch {
    return null;
  }
}

async function logoutCustomUser(): Promise<void> {
  await apiRequest("POST", "/api/auth/logout");
}

export function useCustomAuth() {
  const queryClient = useQueryClient();
  
  const { data: user, isLoading } = useQuery<CustomUser | null>({
    queryKey: ["/api/auth/me"],
    queryFn: fetchCustomUser,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const logoutMutation = useMutation({
    mutationFn: logoutCustomUser,
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      window.location.href = "/";
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin ?? false,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
