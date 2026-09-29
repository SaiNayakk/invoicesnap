"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { validateGstin } from "@/lib/gst";

const input = "h-10 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none";

export function SettingsForm({ initial, email, demo }: { initial: Record<string, string>; email: string; demo: boolean }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const gst = v.gst_number ? validateGstin(v.gst_number) : null;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    const res = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(v) });
    const d = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) return setError(d.error ?? "Couldn't save.");
    setSaved(true);
    router.refresh();
  }

  const f = (k: string, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, hint?: React.ReactNode) => (
    <label className="block space-y-1 text-xs text-zinc-400">{label}
      <input className={input} value={v[k] ?? ""} onChange={(e) => { setV({ ...v, [k]: e.target.value }); setSaved(false); }} {...props} />
      {hint}
    </label>
  );

  return (
    <form onSubmit={save} className="space-y-5">
      <section className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        <h2 className="text-sm font-semibold text-zinc-100">Business</h2>
        {f("business_name", "Business or trading name", { required: true, maxLength: 80 })}
        <div className="grid gap-4 sm:grid-cols-2">
          {f("phone", "Phone", { inputMode: "tel" })}
          <label className="block space-y-1 text-xs text-zinc-400">Sign-in email<input className={input} value={demo ? "Demo account" : email} disabled /></label>
        </div>
        {f("address", "Address")}
        <div className="grid grid-cols-3 gap-3">
          {f("city", "City")}{f("state", "State")}{f("pincode", "PIN", { inputMode: "numeric", maxLength: 6 })}
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        <h2 className="text-sm font-semibold text-zinc-100">Tax and payments</h2>
        {f("gst_number", "GSTIN", { maxLength: 15, placeholder: "Leave empty if not registered" },
          gst && <span className={`block text-[11px] ${gst.ok ? "text-emerald-400" : "text-amber-300"}`}>{gst.ok ? `Valid GSTIN, ${gst.state}` : gst.error}</span>)}
        {f("upi_id", "UPI ID", { placeholder: "yourname@okaxis" }, <span className="block text-[11px] text-zinc-500">Clients pay to this from the payment link. Money goes straight to you.</span>)}
        <div className="grid gap-4 sm:grid-cols-3">
          {f("bank_name", "Bank")}{f("bank_account_number", "Account number", { inputMode: "numeric" })}{f("bank_ifsc", "IFSC", { maxLength: 11 })}
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        <h2 className="text-sm font-semibold text-zinc-100">Invoice defaults</h2>
        <div className="grid grid-cols-2 gap-4">
          {f("invoice_prefix", "Number prefix", { maxLength: 10, placeholder: "INV" })}
          {f("default_due_days", "Payment terms (days)", { type: "number", min: 0, max: 120 })}
        </div>
      </section>

      <div className="flex items-center justify-end gap-3">
        {error && <p className="text-sm text-red-300">{error}</p>}
        {saved && <p className="flex items-center gap-1 text-sm text-emerald-400"><Check size={14} /> Saved</p>}
        <Button type="submit" disabled={saving}>{saving && <Loader2 size={14} className="animate-spin" />} Save changes</Button>
      </div>
    </form>
  );
}
