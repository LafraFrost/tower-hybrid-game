import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { User as SupabaseUser } from "@supabase/supabase-js";

export interface CustomUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  isAdmin: boolean;
}

const ADMIN_EMAILS = ["lafranconi.andrea96@gmail.com"];

function mapSupabaseUser(supabaseUser: SupabaseUser | null): CustomUser | null {
  if (!supabaseUser) return null;

  return {
    id: supabaseUser.id,
    email: supabaseUser.email || "",
    firstName: supabaseUser.user_metadata?.first_name || null,
    lastName: supabaseUser.user_metadata?.last_name || null,
    isAdmin: ADMIN_EMAILS.includes(supabaseUser.email || ""),
  };
}

export function useCustomAuth() {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const mappedUser = mapSupabaseUser(session?.user ?? null);
      console.log('🔐 Auth initial session:', { 
        sessionExists: !!session, 
        userEmail: session?.user?.email,
        mappedUser: mappedUser?.email,
        isAdmin: mappedUser?.isAdmin 
      });
      setUser(mappedUser);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const mappedUser = mapSupabaseUser(session?.user ?? null);
      console.log('🔐 Auth state changed:', { 
        event: _event, 
        userEmail: session?.user?.email,
        mappedUser: mappedUser?.email,
        isAdmin: mappedUser?.isAdmin 
      });
      setUser(mappedUser);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin ?? false,
    logout,
    isLoggingOut,
  };
}
