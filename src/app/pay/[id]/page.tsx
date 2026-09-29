"use client";

import { use, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, CheckCircle2, Loader2, Smartphone } from "lucide-react";
import { formatDay } from "@/lib/dates";
import { formatCurrency } from "@/lib/utils";
import { demoStep } from "@/components/demo/demo-events";

interface PayData {
  invoice_number: string; invoice_date: string; due_date: string; status: string;
  subtotal: number; gst_amount: number; gst_rate: number; total: number;
  business_name: string; business_city: string; upi_id: string | null; client_name: string;
  items: { description: string; quantity: number; rate: number; amount: number }[];
}

/** The page a client opens from WhatsApp: what they owe, a UPI QR and deep link, and "I've paid". */
export default function PayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const inDemoPhone = useSearchParams().get("demo") === "phone";
  const [data, setData] = useState<PayData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    fetch(`/api/pay/${id}`).then((r) => r.json()).then((d) => (d.error ? setError(d.error) : setData(d))).catch(() => setError("Couldn't load this invoice."));
  }, [id]);

  async function claim() {
    setClaiming(true);
    const res = await fetch(`/api/pay/${id}/claimed`, { method: "POST" });
    const d = await res.json().catch(() => ({}));
    setClaiming(false);
    if (!res.ok) return setError(d.error ?? "Something went wrong. Please try again.");
    setData((x) => (x ? { ...x, status: "payment_pending" } : x));
    demoStep("pay");
  }

  const back = inDemoPhone && (
    <button onClick={() => router.push("/demo/phone")} className="mb-4 flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200"><ArrowLeft size={15} /> Back to chat</button>
  );

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-6 text-center">
        {back}
        {error ? <p className="text-sm text-zinc-400">{error}</p> : <Loader2 className="animate-spin text-zinc-600" size={22} />}
      </div>
    );
  }

  const upi = data.upi_id
    ? `upi://pay?pa=${encodeURIComponent(data.upi_id)}&pn=${encodeURIComponent(data.business_name)}&am=${data.total.toFixed(2)}&cu=INR&tn=${encodeURIComponent(data.invoice_number)}`
    : null;
  const late = data.status === "overdue";

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-6">
      <div className="mx-auto w-full max-w-sm space-y-4">
        {back}
        <div className="text-center">
          <p className="text-xs text-zinc-500">Invoice from</p>
          <h1 className="mt-0.5 text-lg font-semibold text-zinc-100">{data.business_name}</h1>
          <p className="text-xs text-zinc-500">{data.invoice_number} · for {data.client_name}</p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
          <p className="text-center text-xs text-zinc-500">{data.status === "paid" ? "Paid" : "Amount due"}</p>
          <p className="mt-1 text-center text-4xl font-semibold tracking-tight tabular-nums text-zinc-50">{formatCurrency(data.total)}</p>
          <p className={`mt-1.5 text-center text-xs ${late ? "text-amber-300" : "text-zinc-500"}`}>{late ? "Was due" : "Due"} {formatDay(data.due_date, true)}</p>
          <ul className="mt-4 space-y-1.5 border-t border-zinc-800 pt-3 text-xs">
            {data.items.map((it, i) => (
              <li key={i} className="flex justify-between gap-3"><span className="text-zinc-400">{it.description}{it.quantity !== 1 && ` × ${it.quantity}`}</span><span className="tabular-nums text-zinc-300">{formatCurrency(it.amount)}</span></li>
            ))}
            {data.gst_amount > 0 && <li className="flex justify-between gap-3"><span className="text-zinc-400">GST {data.gst_rate}%</span><span className="tabular-nums text-zinc-300">{formatCurrency(data.gst_amount)}</span></li>}
          </ul>
        </div>

        {data.status === "paid" ? (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-center">
            <CheckCircle2 size={22} className="mx-auto text-emerald-400" />
            <p className="mt-2 text-sm font-medium text-emerald-200">Payment received. Thank you!</p>
          </div>
        ) : (
          <>
            {upi ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
                <p className="text-xs text-zinc-500">Scan with any UPI app</p>
                <div className="rounded-xl bg-white p-3"><QRCodeSVG value={upi} size={156} /></div>
                <p className="font-mono text-xs text-zinc-400">{data.upi_id}</p>
                <a href={upi} className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-zinc-700 text-sm text-zinc-200 hover:bg-zinc-800"><Smartphone size={15} /> Open a UPI app</a>
              </div>
            ) : (
              <p className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 text-center text-sm text-zinc-400">Please contact {data.business_name} for payment details.</p>
            )}
            {data.status === "payment_pending" ? (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center">
                <p className="text-sm font-medium text-emerald-200">Thanks, we&apos;ve told {data.business_name}.</p>
                <p className="mt-0.5 text-xs text-zinc-400">They&apos;ll confirm once the payment shows up.</p>
              </div>
            ) : (
              <button onClick={claim} disabled={claiming} className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-60">
                {claiming && <Loader2 size={15} className="animate-spin" />} I&apos;ve paid
              </button>
            )}
          </>
        )}
        <p className="pb-4 text-center text-[11px] text-zinc-600">Sent with InvoiceSnap</p>
      </div>
    </div>
  );
}
