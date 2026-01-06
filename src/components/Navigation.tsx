import { Link, useLocation } from "wouter";
import { User, Map, Layers, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHero } from "@/context/HeroContext";

export function Navigation() {
  const [location, setLocation] = useLocation();
  const { resetHero } = useHero();

  const handleExit = () => {
    resetHero();
    setLocation("/");
  };

  const navItems = [
    { href: "/hud/profile", icon: User, label: "Profile" },
    { href: "/hud/tactical", icon: Map, label: "Tactical" },
    { href: "/hud/deck", icon: Layers, label: "Deck" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/90 border-t border-cyan-500/30 backdrop-blur-md pb-safe">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} className="w-full h-full flex items-center justify-center">
              <div 
                className={cn(
                  "flex flex-col items-center gap-1 transition-all duration-300",
                  isActive ? "text-cyan-400 scale-110" : "text-gray-500 hover:text-cyan-400/70"
                )}
              >
                <item.icon 
                  className={cn(
                    "w-6 h-6",
                    isActive && "drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                  )} 
                />
                <span className="text-[10px] font-display uppercase tracking-wider">{item.label}</span>
                {isActive && (
                  <div className="absolute -bottom-[1px] w-12 h-[2px] bg-cyan-400 shadow-[0_0_10px_cyan]" />
                )}
              </div>
            </Link>
          );
        })}
        
        {/* Exit Button */}
        <button 
          onClick={handleExit}
          className="w-full h-full flex items-center justify-center"
          data-testid="button-exit"
        >
          <div className="flex flex-col items-center gap-1 text-red-500 hover:text-red-400 transition-all duration-300">
            <LogOut className="w-6 h-6" />
            <span className="text-[10px] font-display uppercase tracking-wider">Exit</span>
          </div>
        </button>
      </div>
    </nav>
  );
}
