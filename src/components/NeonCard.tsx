import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface NeonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "primary" | "secondary" | "default";
  glow?: boolean;
}

export function NeonCard({ 
  children, 
  className, 
  variant = "default",
  glow = false,
  ...props 
}: NeonCardProps) {
  const variants = {
    default: "border-border/50",
    primary: "border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]",
    secondary: "border-fuchsia-500/50 shadow-[0_0_15px_rgba(217,70,239,0.15)]",
  };

  const glowClass = glow 
    ? variant === "primary" 
      ? "hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:border-cyan-400" 
      : variant === "secondary"
        ? "hover:shadow-[0_0_30px_rgba(217,70,239,0.4)] hover:border-fuchsia-400"
        : "hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]"
    : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "relative rounded-xl border bg-black/80 backdrop-blur-sm p-4 transition-all duration-300",
        variants[variant],
        glowClass,
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      {children}
    </motion.div>
  );
}
