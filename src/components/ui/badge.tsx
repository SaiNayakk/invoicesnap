import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        paid:            "bg-emerald-500/12 text-emerald-400 border border-emerald-500/20",
        sent:            "bg-amber-500/12 text-amber-400 border border-amber-500/20",
        draft:           "bg-zinc-500/12 text-zinc-400 border border-zinc-500/20",
        overdue:         "bg-red-500/12 text-red-400 border border-red-500/20",
        payment_pending: "bg-sky-500/12 text-sky-300 border border-sky-500/20",
        cancelled:       "bg-zinc-500/10 text-zinc-500 border border-zinc-600/30 line-through",
        default:         "bg-zinc-800 text-zinc-300 border border-zinc-700",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, children, ...props }: BadgeProps) {
  const dotColors: Record<string, string> = {
    paid:            "bg-emerald-400",
    sent:            "bg-amber-400",
    draft:           "bg-zinc-400",
    overdue:         "bg-red-400",
    payment_pending: "bg-sky-300",
    cancelled:       "bg-zinc-600",
    default:         "bg-zinc-400",
  };
  const dot = dotColors[variant ?? "default"];

  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      <span className={cn("inline-block w-1.5 h-1.5 rounded-full", dot)} />
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
