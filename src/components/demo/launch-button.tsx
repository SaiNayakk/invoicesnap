"use client";

import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";

const STAGES = ["Creating your studio…", "Adding 14 clients…", "Loading a year of invoices…", "Learning who pays late…", "Opening WhatsApp…"];

/** Creates a live sandbox and lands the visitor in the real app, signed in as its owner. */
export function LaunchDemoButton() {
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function launch() {
    setLoading(true);
    setError(null);
    const t = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 1400);
    try {
      const res = await fetch("/api/demo/start", { method: "POST" });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error ?? "Couldn't start the demo.");
      window.location.href = "/demo/live";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't start the demo.");
      setLoading(false);
    } finally {
      clearInterval(t);
    }
  }

  return (
    <div className="relative">
      <button onClick={launch} disabled={loading}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-400 disabled:opacity-80">
        {loading ? <><Loader2 className="h-4 w-4 animate-spin" />{STAGES[stage]}</> : <>Launch my live demo<ArrowRight className="h-4 w-4" /></>}
      </button>
      {/* Overlays the caption row instead of pushing the button up, so both cards stay aligned. */}
      {error && <p className="absolute left-0 right-0 top-full mt-3 bg-zinc-900 text-center text-xs leading-4 text-red-300">{error}</p>}
    </div>
  );
}
