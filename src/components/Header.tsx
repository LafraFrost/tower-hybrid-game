import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { LogOut } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  showLogout?: boolean;
}

export function Header({ title, subtitle, showLogout = true }: HeaderProps) {
  const { logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full bg-black/80 backdrop-blur-md border-b border-cyan-500/20 py-4 px-6 mb-6">
      <div className="max-w-md mx-auto flex justify-between items-center">
        <div>
          <h1 
            className="text-2xl font-black text-white uppercase tracking-widest glitch" 
            data-text={title}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-cyan-400/80 font-mono tracking-wider uppercase">
              {subtitle}
            </p>
          )}
        </div>
        
        {showLogout && (
          <button 
            onClick={() => logout()}
            className="text-gray-500 hover:text-red-500 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        )}
      </div>
    </header>
  );
}
