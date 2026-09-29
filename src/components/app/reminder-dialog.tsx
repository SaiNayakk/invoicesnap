"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageCircle, RefreshCw, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { demoStep } from "@/components/demo/demo-events";
import { cn } from "@/lib/utils";

type Tone = "friendly" | "firm" | "final";
const TONES: { id: Tone; label: string }[] = [
  { id: "friendly", label: "Friendly" },
  { id: "firm", label: "Firm" },
  { id: "final", label: "Final" },
];

interface Draft { text: string; ai: boolean; tone: Tone; suggested: Tone; language: "en" | "hinglish" }

async function requestDraft(invoiceId: string, tone?: Tone, language?: "en" | "hinglish") {
  const res = await fetch(`/api/invoices/${invoiceId}/reminder`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tone, language }),
  });
  return { ok: res.ok, d: await res.json().catch(() => ({})) };
}

/**
 * Drafts a reminder (tone suggested from how late it is and how many reminders
 * were ignored), lets the owner edit it, then opens WhatsApp with it ready.
 */
export function ReminderDialog({ invoiceId, clientName, onClose, demo }: { invoiceId: string; clientName: string; onClose: () => void; demo: boolean }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const apply = useCallback((r: { ok: boolean; d: Draft & { error?: string } }) => {
    if (!r.ok) setError(r.d.error ?? "Couldn't draft a reminder.");
    else {
      setDraft(r.d);
      setText(r.d.text);
    }
    setLoading(false);
  }, []);

  const load = (tone?: Tone, language?: "en" | "hinglish") => {
    setLoading(true);
    setError(null);
    requestDraft(invoiceId, tone, language).then(apply);
  };

  // First draft on open, with the suggested tone. (loading starts true.)
  useEffect(() => {
    let live = true;
    requestDraft(invoiceId).then((r) => live && apply(r));
    return () => { live = false; };
  }, [invoiceId, apply]);

  async function send() {
    setSending(true);
    setError(null);
    // Open the window first (synchronously) so the browser doesn't block it as a pop-up.
    const win = demo ? null : window.open("", "_blank");
    const res = await fetch(`/api/invoices/${invoiceId}/reminder`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ send: true, text, tone: draft?.tone, ai: draft?.ai && text === draft.text }),
    });
    const d = await res.json().catch(() => ({}));
    setSending(false);
    if (!res.ok) {
      win?.close();
      setError(d.error ?? "Couldn't send.");
      return;
    }
    if (win) win.location.href = d.whatsapp;
    setSent(true);
    demoStep("remind");
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-2xl border border-zinc-800 bg-zinc-950 sm:rounded-2xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={`Reminder to ${clientName}`}>
        <div className="flex items-start justify-between border-b border-zinc-800 px-5 py-4">
          <div>
            <p className="font-semibold text-zinc-100">Reminder to {clientName}</p>
            <p className="mt-0.5 text-xs text-zinc-500">Tone is suggested from how late it is and how many reminders were already sent.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-zinc-500 hover:text-zinc-300"><X size={17} /></button>
        </div>

        {sent ? (
          <div className="space-y-4 px-5 py-6 text-center">
            <p className="text-sm text-zinc-200">{demo ? `Sent. It's now in ${clientName.split(" ")[0]}'s chat on the phone.` : "WhatsApp opened with the message. Press send there."}</p>
            <Button variant="outline" onClick={onClose}>Done</Button>
          </div>
        ) : (
          <div className="space-y-4 px-5 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-lg border border-zinc-800 p-0.5">
                {TONES.map((t) => (
                  <button key={t.id} disabled={loading} onClick={() => load(t.id, draft?.language)}
                    className={cn("rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                      draft?.tone === t.id ? "bg-zinc-100 text-zinc-900" : "text-zinc-400 hover:text-zinc-200")}>
                    {t.label}{draft?.suggested === t.id && <span className="sr-only"> (suggested)</span>}
                  </button>
                ))}
              </div>
              <div className="flex rounded-lg border border-zinc-800 p-0.5">
                {(["en", "hinglish"] as const).map((l) => (
                  <button key={l} disabled={loading} onClick={() => load(draft?.tone, l)}
                    className={cn("rounded-md px-2.5 py-1 text-xs font-medium", draft?.language === l ? "bg-zinc-100 text-zinc-900" : "text-zinc-400 hover:text-zinc-200")}>
                    {l === "en" ? "English" : "Hinglish"}
                  </button>
                ))}
              </div>
              {draft && <span className="text-[11px] text-zinc-500">Suggested: {draft.suggested}</span>}
            </div>

            <div className="relative">
              <textarea value={text} onChange={(e) => setText(e.target.value)} rows={7} disabled={loading}
                className="w-full resize-none rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm leading-relaxed text-zinc-100 focus:border-zinc-600 focus:outline-none disabled:opacity-50" />
              {loading && <Loader2 size={18} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin text-zinc-500" />}
            </div>
            <p className="flex items-center gap-1.5 text-[11px] text-zinc-500">
              {draft?.ai ? <><Sparkles size={11} /> Worded by AI from your invoice details. Amounts and dates are checked against them.</> : "Standard wording."}
              {" "}<code className="text-zinc-400">{"{link}"}</code> becomes the payment link.
            </p>
            {error && <p className="text-sm text-red-300">{error}</p>}
            <div className="flex items-center justify-between gap-2">
              <button onClick={() => load(draft?.tone, draft?.language)} disabled={loading} className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 disabled:opacity-50">
                <RefreshCw size={12} /> Reset
              </button>
              <Button variant="whatsapp" onClick={send} disabled={loading || sending || !text.trim()}>
                {sending ? <Loader2 size={15} className="animate-spin" /> : <MessageCircle size={15} />}
                Send on WhatsApp
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
