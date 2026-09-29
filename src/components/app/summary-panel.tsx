"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { demoStep } from "@/components/demo/demo-events";

interface Brief { bullets: { text: string; facts: number[] }[]; facts: { id: number; text: string }[]; generated: boolean }

/**
 * The money summary. Loading the page only reads a stored summary; writing a
 * new one is one button press (one model call), and only when the numbers have
 * changed since the last one.
 */
export function SummaryPanel({ version }: { version: string }) {
  const [brief, setBrief] = useState<Brief | null>(null);
  const [writing, setWriting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let live = true;
    fetch("/api/ai/brief", { cache: "no-store" }).then((r) => r.json()).then((d) => live && !d.error && setBrief(d)).catch(() => {});
    return () => { live = false; };
  }, [version]);

  async function write() {
    setWriting(true);
    setError(null);
    const res = await fetch("/api/ai/brief", { method: "POST" });
    const d = await res.json().catch(() => ({}));
    setWriting(false);
    if (!res.ok) return setError(d.error ?? "Couldn't write the summary.");
    setBrief(d);
    demoStep("brief");
  }

  if (!brief) return <div className="h-24 animate-pulse rounded-lg bg-zinc-900" />;
  const byId = new Map(brief.facts.map((f) => [f.id, f.text]));
  return (
    <div className="space-y-3">
      {brief.bullets.length ? (
        <ul className="space-y-2.5">
          {brief.bullets.map((b, i) => (
            <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-zinc-200">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-emerald-400" />
              <span>{b.text}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-zinc-400">A few lines on what to do about your money this week, written from the numbers below.</p>
          <button onClick={write} disabled={writing}
            className="flex h-9 items-center gap-2 rounded-lg bg-zinc-100 px-3.5 text-sm font-medium text-zinc-900 hover:bg-white disabled:opacity-60">
            {writing && <Loader2 size={14} className="animate-spin" />}
            {writing ? "Writing…" : "Write this week's summary"}
          </button>
        </div>
      )}
      {error && <p className="text-sm text-red-300">{error}</p>}
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300">
        <ChevronDown size={13} className={open ? "rotate-180 transition-transform" : "transition-transform"} />
        {open ? "Hide" : "See"} the numbers behind this
      </button>
      {open && (
        <ol className="space-y-1.5 rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-400">
          {[...byId].map(([id, text]) => (
            <li key={id} className="flex gap-2">
              <span className="w-4 shrink-0 text-right tabular-nums text-zinc-600">{id}</span>
              <span>{text}</span>
            </li>
          ))}
        </ol>
      )}
      {brief.bullets.length > 0 && <p className="text-[11px] text-zinc-600">Written by AI from these numbers. A sentence with a figure not in them is removed.</p>}
    </div>
  );
}
