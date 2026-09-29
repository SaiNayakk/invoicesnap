"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, FastForward, LayoutDashboard, Loader2, RotateCcw, Smartphone, X } from "lucide-react";
import type { DemoStep } from "@/components/demo/demo-events";
import type { ForwardResult } from "@/lib/demo/forward";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useSessionState } from "@/lib/use-session-state";

type Where = "phone" | "app" | "both";

const STEPS: { id: DemoStep; title: string; body: string; where: Where }[] = [
  { id: "create", title: "Send an invoice from a message", body: "Open New invoice, pick an example or type your own, and press Draft the invoice. Check it, then Save and send. It lands in the client's chat on the phone.", where: "app" },
  { id: "pay", title: "Pay it as the client", body: "On the phone, open that chat, tap the payment link and press I've paid. Then confirm the money on the Overview.", where: "phone" },
  { id: "remind", title: "Chase a late payer", body: "Under Needs your attention, press Remind on an overdue invoice. The tone is picked from how late it is. Try Hinglish too.", where: "app" },
  { id: "forward", title: "Let a week pass", body: "Press Fast-forward. Clients pay (or don't) according to their habits, and you see how the forecast and the late warnings did.", where: "both" },
  { id: "brief", title: "Read this week's summary", body: "On the Overview, write this week's summary. Open the numbers behind it to check every figure.", where: "app" },
  { id: "keep", title: "Make it yours", body: "Keep this account with your own email. Sample clients are removed; anything you created stays.", where: "both" },
];

export function LiveDemo({ sandbox, expiresAt, daysForwarded }: { sandbox: string; expiresAt: string; daysForwarded: number }) {
  const [focus, setFocus] = useState<DemoStep | null>(null);
  const [view, setView] = useState<"app" | "phone">("app"); // phones only
  const [forwarding, setForwarding] = useState(false);
  const [days, setDays] = useState(daysForwarded);
  const [result, setResult] = useState<ForwardResult | null>(null);
  const [forwardError, setForwardError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [left, setLeft] = useState<number | null>(null);
  const app = useRef<HTMLIFrameElement>(null);
  const phone = useRef<HTMLIFrameElement>(null);
  // Progress survives a reload, per sandbox.
  const [saved, setSaved] = useSessionState(`is-demo-${sandbox}`);
  const done = useMemo<Partial<Record<DemoStep, boolean>>>(() => {
    try { return JSON.parse(saved ?? "{}"); } catch { return {}; }
  }, [saved]);
  const mark = useCallback((step: DemoStep) => {
    if (!done[step]) setSaved(JSON.stringify({ ...done, [step]: true }));
    setFocus((f) => (f === step ? null : f));
  }, [done, setSaved]);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin === window.location.origin && e.data?.type === "is-demo-step") mark(e.data.step as DemoStep);
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [mark]);

  useEffect(() => {
    const tick = () => setLeft(Math.max(0, Date.parse(expiresAt) - Date.now()));
    tick();
    const t = setInterval(tick, 15_000);
    return () => clearInterval(t);
  }, [expiresAt]);

  const current = focus ?? STEPS.find((s) => !done[s.id])?.id ?? "keep";
  const step = STEPS.find((s) => s.id === current)!;
  const completed = STEPS.filter((s) => done[s.id]).length;

  // Guide the eye on phones: switch to the side the current step is about.
  const [where, setWhere] = useState(step.where);
  if (step.where !== where) {
    setWhere(step.where);
    if (step.where !== "both") setView(step.where);
  }

  const refreshFrames = () => {
    for (const f of [app.current, phone.current]) f?.contentWindow?.postMessage({ type: "is-demo-refresh" }, window.location.origin);
  };

  async function forward() {
    setForwarding(true);
    setForwardError(null);
    try {
      const res = await fetch("/api/demo/forward", { method: "POST" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Couldn't fast-forward.");
      setResult(d);
      setDays(d.daysForwarded);
      refreshFrames();
      mark("forward");
    } catch (e) {
      setForwardError(e instanceof Error ? e.message : "Couldn't fast-forward.");
    } finally {
      setForwarding(false);
    }
  }

  const mins = left === null ? null : Math.ceil(left / 60_000);

  return (
    <div className="flex h-[100dvh] flex-col bg-zinc-950">
      <div className="shrink-0 border-b border-zinc-800 bg-zinc-900">
        <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="shrink-0 rounded border border-emerald-900 bg-emerald-950 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">Live demo</span>
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
                {step.title}
                {done[step.id] && <Check size={14} className="text-emerald-400" />}
                {step.where !== "both" && (
                  <span className="hidden items-center gap-1 rounded-full border border-emerald-900/60 bg-emerald-950/60 px-2 py-0.5 text-[10px] font-medium text-emerald-400/80 lg:inline-flex">
                    {step.where === "phone" ? <>on the phone <ArrowRight size={10} /></> : <><ArrowLeft size={10} /> in the app</>}
                  </span>
                )}
              </p>
              <p className="line-clamp-2 text-xs leading-snug text-zinc-400 lg:line-clamp-none">{step.body}</p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <div className="mr-1 flex items-center gap-1" aria-label={`${completed} of ${STEPS.length} steps done`}>
              {STEPS.map((s) => (
                <button key={s.id} title={s.title} aria-label={s.title} onClick={() => setFocus(s.id)}
                  className={cn("h-2 rounded-full transition-all", s.id === current ? "w-5 bg-emerald-400" : done[s.id] ? "w-2 bg-emerald-700" : "w-2 bg-zinc-700")} />
              ))}
            </div>
            <button onClick={forward} disabled={forwarding}
              className={cn("flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-60",
                current === "forward" ? "border-zinc-100 bg-zinc-100 text-zinc-900 hover:bg-white" : "border-zinc-700 text-zinc-200 hover:bg-zinc-800")}>
              {forwarding ? <Loader2 size={13} className="animate-spin" /> : <FastForward size={13} />}
              {forwarding ? "A week passes…" : "Fast-forward a week"}
            </button>
            <button onClick={() => setClaiming(true)}
              className={cn("rounded-lg px-3 py-2 text-xs font-semibold text-zinc-950", current === "keep" ? "bg-emerald-400" : "bg-emerald-500 hover:bg-emerald-400")}>
              Keep this account
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 pb-2 text-[11px] text-zinc-500">
          <span>Your private studio{mins !== null && <> · deleted in {mins} min unless you keep it</>}</span>
          {days > 0 && <span className="text-zinc-300">Demo calendar +{days} days</span>}
          {forwardError && <span className="text-red-300">{forwardError}</span>}
          {focus && <button onClick={() => setFocus(null)} className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200"><RotateCcw size={10} />next step</button>}
        </div>
      </div>

      <div className="grid shrink-0 grid-cols-2 border-b border-zinc-800 text-xs font-semibold lg:hidden">
        {(["app", "phone"] as const).map((v) => (
          <button key={v} onClick={() => setView(v)} className={cn("flex items-center justify-center gap-1.5 py-2.5", view === v ? "border-b-2 border-emerald-500 text-emerald-300" : "text-zinc-500")}>
            {v === "app" ? <><LayoutDashboard size={13} />InvoiceSnap</> : <><Smartphone size={13} />WhatsApp</>}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1">
        <main className={cn("min-w-0 flex-1", view === "app" ? "block" : "hidden", "lg:block")}>
          <iframe ref={app} src="/dashboard" title="InvoiceSnap app" className="h-full w-full bg-zinc-950" />
        </main>
        <aside className={cn(view === "phone" ? "flex" : "hidden", "w-full shrink-0 flex-col items-center justify-center border-zinc-800 lg:flex lg:w-[420px] lg:gap-3 lg:border-l lg:py-4")}>
          <p className="hidden items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-zinc-500 lg:flex"><Smartphone size={12} />Your WhatsApp</p>
          <div className="relative h-full w-full overflow-hidden bg-zinc-950 lg:h-[min(720px,calc(100dvh-170px))] lg:w-[350px] lg:rounded-[2.4rem] lg:border-[10px] lg:border-zinc-800 lg:shadow-2xl lg:shadow-black/80">
            <iframe ref={phone} src="/demo/phone" title="WhatsApp on the phone" className="h-full w-full bg-[#0b141a]" />
          </div>
          <p className="hidden px-6 text-center text-[11px] text-zinc-600 lg:block">Every message the app sends lands here. Payment links open the real page your clients see.</p>
        </aside>
      </div>

      {result && <ForwardSummary r={result} onClose={() => setResult(null)} />}
      {claiming && <ClaimDialog onClose={() => setClaiming(false)} />}
    </div>
  );
}

function ForwardSummary({ r, onClose }: { r: ForwardResult; onClose: () => void }) {
  const [all, setAll] = useState(false);
  const inside = r.received >= r.predicted.p10 && r.received <= r.predicted.p90;
  const paid = r.events.filter((e) => e.kind === "paid").length;
  return (
    <div className="fixed bottom-4 left-4 z-50 w-[min(400px,calc(100vw-2rem))] space-y-3 rounded-2xl border border-zinc-700 bg-zinc-900 p-4 shadow-2xl shadow-black/70">
      <div className="flex items-start justify-between">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-zinc-100"><FastForward size={14} className="text-zinc-400" />A week later</p>
        <button onClick={onClose} aria-label="Close" className="text-zinc-500 hover:text-zinc-300"><X size={15} /></button>
      </div>
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Money in</p>
        <p className="text-sm text-zinc-100">
          Forecast said about <strong>{formatCurrency(Math.round(r.predicted.p50))}</strong> ({formatCurrency(Math.round(r.predicted.p10))} to {formatCurrency(Math.round(r.predicted.p90))}).
          {" "}<strong className={inside ? "text-emerald-300" : "text-amber-300"}>{formatCurrency(r.received)} arrived</strong>{inside ? ", inside the range." : ", outside the range."}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-2.5">
          <p className="text-zinc-400">Flagged likely late</p>
          <p className="mt-0.5 text-zinc-100"><strong>{r.flaggedLate - r.flaggedLatePaid}</strong> of {r.flaggedLate} still unpaid</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-2.5">
          <p className="text-zinc-400">Expected this week</p>
          <p className="mt-0.5 text-zinc-100"><strong>{r.onTimeExpectedPaid}</strong> of {r.onTimeExpected} paid</p>
        </div>
      </div>
      <button onClick={() => setAll((a) => !a)} className="text-[11px] text-zinc-500 hover:text-zinc-300">{all ? "Hide" : "Show"} what happened ({paid} payment{paid === 1 ? "" : "s"})</button>
      {all && (
        <ul className="max-h-40 space-y-1 overflow-y-auto text-[11px]">
          {r.events.map((e, i) => (
            <li key={i} className={e.kind === "paid" ? "text-zinc-300" : e.kind === "late" ? "text-amber-300" : "text-zinc-500"}>
              {e.text}{e.flagged ? " (was flagged)" : ""}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ClaimDialog({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/demo/claim", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password }) });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(d.error ?? "Something went wrong.");
      setSaving(false);
      return;
    }
    window.location.href = "/dashboard";
  }

  const input = "h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm space-y-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold text-zinc-100">Keep this account</p>
            <p className="mt-0.5 text-xs text-zinc-500">The sample clients and their invoices are removed. Anything you created stays.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-zinc-500"><X size={16} /></button>
        </div>
        <input className={input} placeholder="Business name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
        <input className={input} placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        <input className={input} placeholder="Password (8+ characters)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
        {error && <p className="text-sm text-red-300">{error}</p>}
        <button disabled={saving} className="h-11 w-full rounded-lg bg-emerald-500 font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50">{saving ? "Saving…" : "Create my account"}</button>
      </form>
    </div>
  );
}
