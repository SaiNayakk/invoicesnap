import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  iconSize?: number;
  textSize?: string;
  showText?: boolean;
}

export function Logo({
  className,
  iconSize = 18,
  textSize = "text-xl",
  showText = true,
}: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/25">
        <Zap size={iconSize} className="text-emerald-400 fill-emerald-400/40" />
      </div>
      {showText && (
        <span className={cn("font-display font-semibold text-zinc-100", textSize)}>
          Invoice<span className="text-emerald-400">Snap</span>
        </span>
      )}
    </div>
  );
}
