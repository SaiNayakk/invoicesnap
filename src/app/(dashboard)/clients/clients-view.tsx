"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Empty, Initial } from "@/components/app/ui";
import { formatCurrency } from "@/lib/utils";

export interface ClientRow {
  id: string; name: string; phone: string; email: string; city: string; gst: string;
  billed: number; outstanding: number; paid: number; onTime: number; typicalDelay: number | null;
}

function habit(r: ClientRow): { text: string; tone: string } {
  if (!r.paid) return { text: "No payments yet", tone: "text-zinc-500" };
  const rate = r.onTime / r.paid;
  const d = r.typicalDelay ?? 0;
  if (rate >= 0.85 && d <= 2) return { text: "Pays on time", tone: "text-emerald-300" };
  if (rate >= 0.6) return { text: `Usually ${d > 0 ? `${d} days late` : "on time"}`, tone: "text-zinc-300" };
  return { text: `Often late, typically ${d} days`, tone: "text-red-300" };
}

export function ClientsView({ rows }: { rows: ClientRow[] }) {
  const [adding, setAdding] = useState(false);
  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button size="sm" onClick={() => setAdding(true)}><Plus size={14} /> Add client</Button>
      </div>
      {rows.length === 0 ? (
        <div className="rounded-xl border border-zinc-800"><Empty>No clients yet. Add one, or create an invoice from a message and it will be added for you.</Empty></div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((r) => {
            const h = habit(r);
            return (
              <div key={r.id} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                <div className="flex items-start gap-3">
                  <Initial name={r.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-100">{r.name}</p>
                    <p className="truncate text-xs text-zinc-500">{[r.phone, r.city].filter(Boolean).join(" · ") || "No phone"}</p>
                  </div>
                  {r.gst && <span className="shrink-0 rounded border border-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-400">GST</span>}
                </div>
                <dl className="mt-4 grid grid-cols-3 gap-2 text-xs">
                  <div><dt className="text-zinc-500">Billed</dt><dd className="mt-0.5 tabular-nums text-zinc-200">{formatCurrency(r.billed)}</dd></div>
                  <div><dt className="text-zinc-500">Owed</dt><dd className={`mt-0.5 tabular-nums ${r.outstanding ? "text-zinc-50" : "text-zinc-500"}`}>{formatCurrency(r.outstanding)}</dd></div>
                  <div><dt className="text-zinc-500">On time</dt><dd className="mt-0.5 tabular-nums text-zinc-200">{r.paid ? `${r.onTime}/${r.paid}` : "-"}</dd></div>
                </dl>
                <p className={`mt-3 border-t border-zinc-800 pt-3 text-xs ${h.tone}`}>{h.text}</p>
              </div>
            );
          })}
        </div>
      )}
      {adding && <AddClient onClose={() => setAdding(false)} />}
    </>
  );
}

function AddClient({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [f, setF] = useState({ name: "", phone: "", email: "", city: "", state: "", gst_number: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = "h-10 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-600 focus:outline-none";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    const d = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) return setError(d.error ?? "Couldn't add the client.");
    onClose();
    router.refresh();
  }

  const field = (k: keyof typeof f, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="block space-y-1 text-xs text-zinc-400">{label}
      <input className={input} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} {...props} />
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center sm:p-4" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="w-full max-w-md space-y-3 rounded-t-2xl border border-zinc-800 bg-zinc-950 p-5 sm:rounded-2xl">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-zinc-100">Add a client</p>
          <button type="button" onClick={onClose} aria-label="Close" className="text-zinc-500 hover:text-zinc-300"><X size={17} /></button>
        </div>
        {field("name", "Name or company", { required: true, maxLength: 80, autoFocus: true })}
        <div className="grid grid-cols-2 gap-3">
          {field("phone", "WhatsApp number", { inputMode: "tel", placeholder: "98450 12345" })}
          {field("email", "Email", { type: "email" })}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {field("city", "City")}
          {field("state", "State", { placeholder: "Filled from GSTIN" })}
        </div>
        {field("gst_number", "GSTIN (if registered)", { maxLength: 15, placeholder: "29ABCDE1234F1Z5" })}
        {error && <p className="text-sm text-red-300">{error}</p>}
        <Button type="submit" className="w-full" disabled={saving}>{saving && <Loader2 size={14} className="animate-spin" />} Add client</Button>
      </form>
    </div>
  );
}
