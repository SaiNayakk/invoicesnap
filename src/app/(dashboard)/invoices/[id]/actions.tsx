"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Download, Loader2, MessageCircle, RotateCcw, Trash2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReminderDialog } from "@/components/app/reminder-dialog";
import { demoStep } from "@/components/demo/demo-events";
import type { InvoiceStatus } from "@/lib/types";

export function InvoiceActions({ id, number, status, clientName, demo }: { id: string; number: string; status: InvoiceStatus; clientName: string; demo: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [remind, setRemind] = useState(false);
  const [copied, setCopied] = useState(false);
  const [thanks, setThanks] = useState<{ text: string; phone: string } | null>(null);

  async function run(key: string, fn: () => Promise<Response>, after?: (d: Record<string, string>) => void) {
    setBusy(key);
    setError(null);
    const res = await fn();
    const d = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) return setError(d.error ?? "Something went wrong.");
    after?.(d);
    router.refresh();
  }

  const post = (path: string, body?: unknown) => fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });

  function send() {
    const win = demo ? null : window.open("", "_blank");
    run("send", () => post(`/api/invoices/${id}/send`), (d) => { if (win) win.location.href = d.whatsapp; });
  }

  const open = ["sent", "overdue"].includes(status);
  return (
    <div className="space-y-2">
      {status === "draft" && (
        <Button variant="whatsapp" className="w-full" onClick={send} disabled={!!busy}>
          {busy === "send" ? <Loader2 size={15} className="animate-spin" /> : <MessageCircle size={15} />} Send on WhatsApp
        </Button>
      )}
      {status === "payment_pending" && (
        <>
          <Button className="w-full" disabled={!!busy} onClick={() => run("confirm", () => post(`/api/invoices/${id}/confirm-payment`), (d) => { setThanks({ text: d.thankYou, phone: d.phone }); demoStep("pay"); })}>
            {busy === "confirm" ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Money received
          </Button>
          <Button variant="outline" className="w-full" disabled={!!busy} onClick={() => run("reopen", () => fetch(`/api/invoices/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "reopen" }) }))}>
            <RotateCcw size={14} /> Not received yet
          </Button>
        </>
      )}
      {open && (
        <>
          <Button variant="whatsapp" className="w-full" onClick={() => setRemind(true)}><MessageCircle size={15} /> Send a reminder</Button>
          <Button variant="outline" className="w-full" disabled={!!busy} onClick={() => run("confirm", () => post(`/api/invoices/${id}/confirm-payment`), (d) => setThanks({ text: d.thankYou, phone: d.phone }))}>
            {busy === "confirm" ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Mark as paid
          </Button>
        </>
      )}
      <div className="flex flex-wrap gap-2 pt-1">
        {status !== "draft" && status !== "cancelled" && (
          <Button variant="ghost" size="sm" onClick={async () => { await navigator.clipboard.writeText(`${window.location.origin}/pay/${id}`); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
            <Copy size={13} /> {copied ? "Copied" : "Payment link"}
          </Button>
        )}
        <Button variant="ghost" size="sm" asChild><a href={`/api/invoices/${id}/pdf`} download={`${number}.pdf`}><Download size={13} /> PDF</a></Button>
        {open && (
          <Button variant="ghost" size="sm" disabled={!!busy} onClick={() => confirm(`Cancel ${number}? The client's payment link stops working.`) && run("cancel", () => fetch(`/api/invoices/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "cancel" }) }))}>
            <XCircle size={13} /> Cancel
          </Button>
        )}
        {status === "draft" && (
          <Button variant="ghost" size="sm" className="text-red-300 hover:text-red-200" disabled={!!busy}
            onClick={async () => { if (!confirm(`Delete draft ${number}?`)) return; const r = await fetch(`/api/invoices/${id}`, { method: "DELETE" }); if (r.ok) { router.push("/invoices"); router.refresh(); } }}>
            <Trash2 size={13} /> Delete
          </Button>
        )}
      </div>
      {thanks && !demo && (
        <p className="text-xs text-zinc-400">Payment recorded. <a className="text-emerald-400 underline" target="_blank" rel="noreferrer" href={`https://wa.me/${thanks.phone.replace(/\D/g, "").replace(/^(\d{10})$/, "91$1")}?text=${encodeURIComponent(thanks.text)}`}>Send a thank-you on WhatsApp</a></p>
      )}
      {thanks && demo && <p className="text-xs text-zinc-400">Payment recorded, and a thank-you went to {clientName.split(" ")[0]} on the phone.</p>}
      {error && <p className="text-sm text-red-300">{error}</p>}
      {remind && <ReminderDialog invoiceId={id} clientName={clientName} demo={demo} onClose={() => setRemind(false)} />}
    </div>
  );
}
