import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { STATUS_LABEL, type InvoiceStatus } from "@/lib/types";

export function PageHeader({ title, sub, actions }: { title: string; sub?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-semibold text-zinc-50">{title}</h1>
        {sub && <p className="mt-1 text-sm text-zinc-500">{sub}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, sub, action, children, className, bodyClass }: {
  title?: React.ReactNode; sub?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string; bodyClass?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-zinc-800 bg-zinc-900/40", className)}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 border-b border-zinc-800 px-5 py-3.5">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>}
            {sub && <p className="mt-0.5 text-xs text-zinc-500">{sub}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={cn("p-5", bodyClass)}>{children}</div>
    </section>
  );
}

export function StatusBadge({ status }: { status: InvoiceStatus }) {
  return <Badge variant={status}>{STATUS_LABEL[status]}</Badge>;
}

const RISK = {
  high: { label: "Likely late", cls: "text-red-300 bg-red-500/10 border-red-500/20" },
  medium: { label: "Might be late", cls: "text-amber-300 bg-amber-500/10 border-amber-500/20" },
  low: { label: "On track", cls: "text-zinc-400 bg-zinc-800/60 border-zinc-700/60" },
};

export function RiskBadge({ level, title }: { level: "low" | "medium" | "high"; title?: string }) {
  const r = RISK[level];
  return <span title={title} className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium", r.cls)}>{r.label}</span>;
}

export function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "red" | "green" }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3.5">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className={cn("mt-1 text-xl font-semibold tabular-nums", tone === "red" ? "text-red-300" : tone === "green" ? "text-emerald-300" : "text-zinc-50")}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-zinc-500">{sub}</p>}
    </div>
  );
}

export function Initial({ name }: { name: string }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-xs font-semibold text-zinc-300">
      {name.trim()[0]?.toUpperCase() ?? "?"}
    </span>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="py-12 text-center text-sm text-zinc-500">{children}</div>;
}
