"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Camera, ChevronLeft, Loader2, MessageCircle, Plus, Sparkles, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { computeTotals, GST_SLABS, supplyType } from "@/lib/gst";
import { addDays } from "@/lib/dates";
import { cn, formatCurrency } from "@/lib/utils";
import { demoStep } from "@/components/demo/demo-events";
import type { Draft } from "@/lib/ai/draft";

interface ClientOpt { id: string; name: string; phone: string; gst_number: string; state: string }
interface Line { key: number; description: string; quantity: number; rate: number; note: string | null }

const SAMPLES = [
  "Bill Brewline for 2 reel shoots at 6.5k each plus this month's social media retainer 18000. GST 18%, due in a week.",
  "Meera ko 3 course posters ka bill bhejo, 3000 each. 7 din mein payment.",
  "New client Rohit Kumar, 9880122334. Product photography 16k and 12 extra edited photos at 500 each, due in 15 days.",
];

const input = "h-10 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-600 focus:outline-none";
let nextKey = 1;
const blank = (): Line => ({ key: nextKey++, description: "", quantity: 1, rate: 0, note: null });

/** Shrinks a photo in the browser (max 1600 px, JPEG) so uploads stay small on mobile data. */
async function compress(file: File): Promise<{ mime: string; data: string }> {
  const img = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * scale);
  c.height = Math.round(img.height * scale);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  const url = c.toDataURL("image/jpeg", 0.82);
  return { mime: "image/jpeg", data: url.split(",")[1] };
}

export function InvoiceBuilder({ clients: initialClients, seller, today, defaultDueDays, demo }: {
  clients: ClientOpt[]; seller: { gst_number: string; state: string; hasUpi: boolean }; today: string; defaultDueDays: number; demo: boolean;
}) {
  const router = useRouter();
  const [clients] = useState(initialClients);
  const [clientId, setClientId] = useState("");
  const [newClient, setNewClient] = useState<{ name: string; phone: string; email: string } | null>(null);
  const [date, setDate] = useState(today);
  const [due, setDue] = useState(addDays(today, defaultDueDays));
  const [lines, setLines] = useState<Line[]>([blank()]);
  const [gst, setGst] = useState(0);
  const [notes, setNotes] = useState("");
  const [fromAI, setFromAI] = useState(false);

  const [message, setMessage] = useState("");
  const [photo, setPhoto] = useState<{ mime: string; data: string; name: string } | null>(null);
  const [drafting, setDrafting] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [matchNote, setMatchNote] = useState<string | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [saving, setSaving] = useState<"draft" | "send" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const client = clients.find((c) => c.id === clientId);
  const supply = supplyType(seller.gst_number, seller.state, client?.gst_number ?? "", client?.state ?? "");
  const totals = useMemo(() => computeTotals(lines.filter((l) => l.description || l.rate), gst, supply), [lines, gst, supply]);

  async function draftFromMessage() {
    setDrafting(true);
    setDraftError(null);
    const res = await fetch("/api/ai/extract", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: message, image: photo ? { mime: photo.mime, data: photo.data } : undefined }),
    });
    const d = await res.json().catch(() => ({}));
    setDrafting(false);
    if (!res.ok) return setDraftError(d.error ?? "Couldn't read that.");
    const draft = d.draft as Draft;
    setClientId(draft.clientId ?? "");
    setNewClient(draft.newClient);
    setMatchNote(draft.matchNote);
    setDue(draft.dueDate);
    setGst(draft.gstRate);
    if (draft.notes) setNotes(draft.notes);
    setLines(draft.items.length ? draft.items.map((it) => ({ key: nextKey++, ...it })) : [blank()]);
    setWarnings(draft.warnings);
    setFromAI(true);
  }

  async function onPhoto(f: File | undefined) {
    if (!f) return;
    try {
      setPhoto({ ...(await compress(f)), name: f.name });
    } catch {
      setDraftError("Couldn't read that image. Try a JPEG or PNG.");
    }
  }

  const setLine = (key: number, patch: Partial<Line>) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch, note: null } : l)));

  async function save(send: boolean) {
    setError(null);
    setSaving(send ? "send" : "draft");
    // Open WhatsApp's window now, while we still have the click, or the browser blocks it.
    const win = send && !demo ? window.open("", "_blank") : null;
    try {
      let cid = clientId;
      if (!cid && newClient) {
        const r = await fetch("/api/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newClient) });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "Couldn't add the client.");
        cid = d.client.id;
      }
      const res = await fetch("/api/invoices", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client: cid, items: lines, gst_rate: gst, invoice_date: date, due_date: due, notes, source: fromAI ? "ai" : "manual" }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Couldn't save the invoice.");
      if (send) {
        const s = await fetch(`/api/invoices/${d.invoice.id}/send`, { method: "POST" });
        const sd = await s.json();
        if (!s.ok) throw new Error(sd.error ?? "Saved as a draft, but couldn't send.");
        if (win) win.location.href = sd.whatsapp;
        if (fromAI) demoStep("create");
      }
      router.push(`/invoices/${d.invoice.id}`);
      router.refresh();
    } catch (e) {
      win?.close();
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setSaving(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-2">
        <Link href="/invoices" aria-label="Back to invoices" className="-ml-2 flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-900"><ChevronLeft size={18} /></Link>
        <h1 className="font-display text-2xl font-semibold text-zinc-50">New invoice</h1>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-5">
          {/* Start from a message */}
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles size={15} className="text-emerald-400" />
              <h2 className="text-sm font-semibold text-zinc-100">Start from a message</h2>
            </div>
            <p className="mb-3 text-sm text-zinc-400">Type it the way you&apos;d text a friend, in English or Hinglish, or add a photo of a handwritten bill. You review everything before it&apos;s saved.</p>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} maxLength={1500}
              placeholder="Bill Sneha for 3 reels at 4.5k each and editing 2000, GST 18, due in 15 days"
              className="w-full resize-none rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none" />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {SAMPLES.map((s, i) => (
                <button key={i} onClick={() => setMessage(s)} className="max-w-full truncate rounded-full border border-zinc-800 px-2.5 py-1 text-left text-[11px] text-zinc-400 hover:border-zinc-600 hover:text-zinc-200">
                  {i === 1 ? "Hinglish example" : i === 2 ? "New client example" : "Example"}: {s.slice(0, 38)}…
                </button>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button onClick={draftFromMessage} disabled={drafting || (!message.trim() && !photo)} size="sm">
                {drafting ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {drafting ? "Reading…" : "Draft the invoice"}
              </Button>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0])} />
              {photo ? (
                <span className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-300">
                  <Camera size={13} /> <span className="max-w-40 truncate">{photo.name}</span>
                  <button onClick={() => setPhoto(null)} aria-label="Remove photo" className="text-zinc-500 hover:text-zinc-200"><X size={13} /></button>
                </span>
              ) : (
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}><Camera size={14} /> Add a photo</Button>
              )}
            </div>
            {draftError && <p className="mt-3 text-sm text-red-300">{draftError}</p>}
            {fromAI && (
              <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs">
                {lines.some((l) => l.description) && <p className="text-zinc-300">Filled in below. Every price was found in your message; lines without one were left out.</p>}
                {matchNote && <p className="mt-1 text-zinc-400">{matchNote}</p>}
                {warnings.map((w) => <p key={w} className="mt-1 flex items-start gap-1.5 text-amber-300"><AlertTriangle size={12} className="mt-0.5 shrink-0" />{w}</p>)}
              </div>
            )}
          </section>

          {/* Bill to */}
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
            <h2 className="mb-3 text-sm font-semibold text-zinc-100">Bill to</h2>
            {newClient ? (
              <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                <input className={input} value={newClient.name} onChange={(e) => setNewClient({ ...newClient, name: e.target.value })} placeholder="Client name" aria-label="New client name" />
                <input className={input} value={newClient.phone} onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })} placeholder="WhatsApp number" aria-label="New client phone" inputMode="tel" />
                <Button variant="ghost" size="sm" className="h-10" onClick={() => setNewClient(null)}>Pick existing</Button>
                <p className="text-xs text-zinc-500 sm:col-span-3">A new client. They&apos;ll be saved with the invoice.</p>
              </div>
            ) : (
              <div className="flex gap-2">
                <select value={clientId} onChange={(e) => setClientId(e.target.value)} className={cn(input, "flex-1")} aria-label="Client">
                  <option value="">Choose a client…</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <Button variant="outline" className="h-10" onClick={() => setNewClient({ name: "", phone: "", email: "" })}><Plus size={14} /> New</Button>
              </div>
            )}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="space-y-1 text-xs text-zinc-400">Invoice date<input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={input} /></label>
              <label className="space-y-1 text-xs text-zinc-400">Due date<input type="date" value={due} min={date} onChange={(e) => setDue(e.target.value)} className={input} /></label>
            </div>
          </section>

          {/* Items */}
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
            <h2 className="mb-3 text-sm font-semibold text-zinc-100">Items</h2>
            <div className="mb-1.5 hidden grid-cols-[1fr_70px_110px_100px_36px] gap-2 px-1 text-[11px] uppercase tracking-wide text-zinc-500 sm:grid">
              <span>Description</span><span className="text-center">Qty</span><span className="text-right">Rate (₹)</span><span className="text-right">Amount</span><span />
            </div>
            <div className="space-y-3 sm:space-y-2">
              {lines.map((l) => (
                <div key={l.key}>
                  <div className="grid grid-cols-[1fr_36px] gap-2 sm:grid-cols-[1fr_70px_110px_100px_36px] sm:items-center">
                    <input className={cn(input, l.note && "border-amber-500/40")} value={l.description} placeholder="Wedding photography" aria-label="Description"
                      onChange={(e) => setLine(l.key, { description: e.target.value })} />
                    <button onClick={() => setLines((ls) => (ls.length > 1 ? ls.filter((x) => x.key !== l.key) : [blank()]))} aria-label="Remove line"
                      className="flex h-10 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-800 hover:text-red-300 sm:order-last"><Trash2 size={15} /></button>
                    <div className="col-span-2 grid grid-cols-[70px_1fr_auto] items-center gap-2 sm:col-span-3 sm:grid-cols-[70px_110px_100px]">
                      <input className={cn(input, "text-center")} type="number" min="0" step="any" value={l.quantity} aria-label="Quantity"
                        onChange={(e) => setLine(l.key, { quantity: parseFloat(e.target.value) || 0 })} />
                      <input className={cn(input, "text-right", l.note && l.rate === 0 && "border-amber-500/40")} type="number" min="0" step="any" value={l.rate || ""} placeholder="0" aria-label="Rate"
                        onChange={(e) => setLine(l.key, { rate: parseFloat(e.target.value) || 0 })} />
                      <span className="text-right text-sm tabular-nums text-zinc-300">{formatCurrency(l.quantity * l.rate)}</span>
                    </div>
                  </div>
                  {l.note && <p className="mt-1 flex items-center gap-1 text-[11px] text-amber-300"><AlertTriangle size={11} />{l.note}</p>}
                </div>
              ))}
            </div>
            <button onClick={() => setLines((ls) => [...ls, blank()])} className="mt-3 flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300"><Plus size={14} /> Add item</button>
          </section>

          <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
            <h2 className="mb-3 text-sm font-semibold text-zinc-100">Notes <span className="font-normal text-zinc-500">(optional)</span></h2>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={500} placeholder="Thanks for the work together."
              className="w-full resize-none rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none" />
          </section>
        </div>

        {/* Summary */}
        <aside>
          <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 lg:sticky lg:top-6">
            <label className="block space-y-1 text-xs text-zinc-400">GST
              <select value={gst} onChange={(e) => setGst(Number(e.target.value))} className={input}>
                {GST_SLABS.map((r) => <option key={r} value={r}>{r === 0 ? "No GST" : `${r}%`}</option>)}
              </select>
            </label>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-zinc-400">Subtotal</dt><dd className="tabular-nums text-zinc-200">{formatCurrency(totals.subtotal)}</dd></div>
              {gst > 0 && (supply === "intra" ? (
                <>
                  <div className="flex justify-between"><dt className="text-zinc-400">CGST {gst / 2}%</dt><dd className="tabular-nums text-zinc-200">{formatCurrency(totals.cgst_amount)}</dd></div>
                  <div className="flex justify-between"><dt className="text-zinc-400">SGST {gst / 2}%</dt><dd className="tabular-nums text-zinc-200">{formatCurrency(totals.sgst_amount)}</dd></div>
                </>
              ) : (
                <div className="flex justify-between"><dt className="text-zinc-400">IGST {gst}%</dt><dd className="tabular-nums text-zinc-200">{formatCurrency(totals.igst_amount)}</dd></div>
              ))}
              <div className="flex items-baseline justify-between border-t border-zinc-800 pt-3"><dt className="font-medium text-zinc-200">Total</dt><dd className="font-display text-2xl font-semibold tabular-nums text-zinc-50">{formatCurrency(totals.total)}</dd></div>
            </dl>
            {gst > 0 && client && <p className="text-[11px] text-zinc-500">{supply === "inter" ? "Different states, so IGST." : "Same state, so CGST and SGST."}</p>}
            {error && <p className="text-sm text-red-300">{error}</p>}
            <div className="space-y-2">
              <Button variant="whatsapp" className="w-full" size="lg" onClick={() => save(true)} disabled={!!saving || (!clientId && !newClient?.name)}>
                {saving === "send" ? <Loader2 size={16} className="animate-spin" /> : <MessageCircle size={16} />} Save and send
              </Button>
              <Button variant="outline" className="w-full" onClick={() => save(false)} disabled={!!saving || (!clientId && !newClient?.name)}>
                {saving === "draft" && <Loader2 size={14} className="animate-spin" />} Save as draft
              </Button>
            </div>
            <p className="text-[11px] leading-relaxed text-zinc-500">
              {demo ? "In the demo, the WhatsApp message appears on the phone." : "Opens WhatsApp with the invoice and a UPI payment link ready to send."}
              {!seller.hasUpi && !demo && <> Add your UPI ID in <Link href="/settings" className="underline">Settings</Link> so clients can pay from the link.</>}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
