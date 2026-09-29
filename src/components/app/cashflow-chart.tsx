"use client";

import { useState } from "react";
import { formatDay } from "@/lib/dates";
import { formatCurrency } from "@/lib/utils";
import type { Week } from "@/lib/ai/payments";

const compact = (n: number) => (n >= 100_000 ? `₹${(n / 100_000).toFixed(n >= 1_000_000 ? 0 : 1)}L` : n >= 1000 ? `₹${Math.round(n / 1000)}k` : `₹${Math.round(n)}`);

/**
 * Weekly money expected in: the bar is the middle outcome of 500 simulations,
 * the whisker spans the 10th to 90th percentile.
 */
export function CashflowChart({ weeks }: { weeks: Week[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...weeks.map((w) => w.p90));
  const H = 150, W = 100 / weeks.length;
  const y = (v: number) => H - (v / max) * H;
  const sel = hover ?? 0;
  const w = weeks[sel];

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <p className="text-sm text-zinc-300">
          <span className="text-zinc-500">{sel === 0 ? "This week" : `Week of ${formatDay(w.start)}`}: </span>
          <span className="font-semibold tabular-nums text-zinc-50">{formatCurrency(Math.round(w.p50))}</span>
          <span className="text-zinc-500"> likely, {formatCurrency(Math.round(w.p10))} to {formatCurrency(Math.round(w.p90))}</span>
        </p>
      </div>
      <svg viewBox={`0 0 100 ${H + 22}`} preserveAspectRatio="none" className="h-44 w-full overflow-visible" role="img"
        aria-label={`Expected money in over the next ${weeks.length} weeks`}>
        {[0.5, 1].map((f) => (
          <line key={f} x1="0" x2="100" y1={y(max * f)} y2={y(max * f)} className="stroke-zinc-800" strokeWidth="0.3" vectorEffect="non-scaling-stroke" />
        ))}
        {weeks.map((wk, i) => {
          const cx = i * W + W / 2;
          const active = i === sel;
          return (
            <g key={wk.start} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onClick={() => setHover(i)} className="cursor-pointer">
              <rect x={i * W} y="0" width={W} height={H + 22} fill="transparent" />
              <rect x={cx - W * 0.28} y={y(wk.p50)} width={W * 0.56} height={Math.max(0.5, H - y(wk.p50))} rx="1"
                className={active ? "fill-emerald-500" : "fill-emerald-500/45"} />
              <line x1={cx} x2={cx} y1={y(wk.p90)} y2={y(wk.p10)} className={active ? "stroke-zinc-200" : "stroke-zinc-500"} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
              <line x1={cx - W * 0.1} x2={cx + W * 0.1} y1={y(wk.p90)} y2={y(wk.p90)} className={active ? "stroke-zinc-200" : "stroke-zinc-500"} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            </g>
          );
        })}
      </svg>
      <div className="mt-1 grid text-center text-[11px] text-zinc-500" style={{ gridTemplateColumns: `repeat(${weeks.length}, 1fr)` }}>
        {weeks.map((wk, i) => <span key={wk.start} className={i === sel ? "text-zinc-200" : ""}>{i === 0 ? "This wk" : formatDay(wk.start)}</span>)}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-zinc-600"><span>Bars: likely amount</span><span>Lines: 10th to 90th percentile, top {compact(max)}</span></div>
    </div>
  );
}
