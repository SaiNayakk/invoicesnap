import { cn } from "@/lib/utils";

/** A receipt with a torn edge: the product in one glyph. */
export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <rect width="32" height="32" rx="7" className="fill-zinc-900" />
      <path d="M9 6.5h14v19l-2.33-1.6-2.34 1.6-2.33-1.6-2.33 1.6-2.34-1.6L9 25.5z" className="fill-emerald-500" />
      <path d="M12.5 12h7M12.5 15.5h7M12.5 19h4" className="stroke-zinc-900" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ size = 28, className, showText = true }: { size?: number; className?: string; showText?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark size={size} />
      {showText && <span className="font-display text-lg font-semibold tracking-tight text-zinc-100">InvoiceSnap</span>}
    </span>
  );
}
