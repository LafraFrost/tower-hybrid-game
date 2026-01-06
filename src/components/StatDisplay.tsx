import { cn } from "@/lib/utils";

interface StatDisplayProps {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  color?: "cyan" | "magenta" | "green";
  className?: string;
}

export function StatDisplay({ label, value, icon, color = "cyan", className }: StatDisplayProps) {
  const colorClasses = {
    cyan: "text-primary border-primary/30",
    magenta: "text-secondary border-secondary/30",
    green: "text-green-500 border-green-500/30",
  };

  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-3 rounded-lg border bg-black/40 backdrop-blur-sm",
      colorClasses[color],
      className
    )}>
      <div className="text-xs font-mono uppercase tracking-widest opacity-80 mb-1 flex items-center gap-1">
        {icon} {label}
      </div>
      <div className="text-2xl font-display font-bold leading-none tracking-wider neon-text">
        {value}
      </div>
    </div>
  );
}
