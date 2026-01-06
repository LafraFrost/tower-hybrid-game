import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface CyberButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "destructive" | "outline";
  isLoading?: boolean;
}

export function CyberButton({ 
  children, 
  className, 
  variant = "primary", 
  isLoading, 
  disabled,
  ...props 
}: CyberButtonProps) {
  
  const baseStyles = "relative px-6 py-3 font-display font-bold uppercase tracking-widest transition-all duration-200 clip-path-polygon active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-primary text-black hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(0,255,255,0.5)]",
    secondary: "bg-secondary text-black hover:bg-secondary/90 hover:shadow-[0_0_15px_rgba(255,0,255,0.5)]",
    destructive: "bg-destructive text-white hover:bg-destructive/90 hover:shadow-[0_0_15px_rgba(255,0,0,0.5)]",
    outline: "bg-transparent border border-primary text-primary hover:bg-primary/10 hover:shadow-[0_0_10px_rgba(0,255,255,0.3)]",
  };

  return (
    <button 
      className={cn(baseStyles, variants[variant], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {/* Corner decorations */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-current opacity-50" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-current opacity-50" />
      
      <div className="flex items-center justify-center gap-2">
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </div>
    </button>
  );
}
