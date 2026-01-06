import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const neonButtonVariants = cva(
  "relative inline-flex items-center justify-center rounded-md font-display font-bold uppercase tracking-wider transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 overflow-hidden group",
  {
    variants: {
      variant: {
        primary:
          "bg-transparent border-2 border-cyan-500 text-cyan-400 hover:bg-cyan-950 hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] active:scale-95",
        secondary:
          "bg-transparent border-2 border-fuchsia-500 text-fuchsia-400 hover:bg-fuchsia-950 hover:shadow-[0_0_20px_rgba(217,70,239,0.5)] active:scale-95",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: {
        default: "h-11 px-8 py-2 text-sm",
        sm: "h-9 rounded-md px-4 text-xs",
        lg: "h-14 rounded-md px-10 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof neonButtonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const NeonButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, ...props }, ref) => {
    return (
      <button
        className={cn(neonButtonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        <span className="relative z-10 flex items-center gap-2">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {children}
        </span>
        {/* Glow effect behind */}
        <div className="absolute inset-0 -z-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300 bg-current blur-md" />
      </button>
    );
  }
);
NeonButton.displayName = "NeonButton";

export { NeonButton, neonButtonVariants };
