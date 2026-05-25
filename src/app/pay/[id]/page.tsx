"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle2, Loader2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

type InvoicePayData = {
  invoice_number: string;
  amount: number;
  status: string;
  due_date: string;
  business_name: string;
  upi_id: string | null;
};

export default function PayPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId]               = useState<string | null>(null);
  const [data, setData]           = useState<InvoicePayData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [claiming, setClaiming]   = useState(false);
  const [claimed, setClaimed]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    params.then(({ id: resolvedId }) => {
      setId(resolvedId);
      fetch(`/api/pay/${resolvedId}`)
        .then((r) => r.json())
        .then((json) => {
          if (json.error) setError(json.error);
          else {
            setData(json as InvoicePayData);
            if (json.status === "payment_pending") setClaimed(true);
          }
        })
        .catch(() => setError("Failed to load invoice"))
        .finally(() => setLoading(false));
    });
  }, [params]);

  async function handleClaimed() {
    if (!id) return;
    setClaiming(true);
    try {
      const res = await fetch(`/api/pay/${id}/claimed`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) setError(json.error ?? "Something went wrong");
      else setClaimed(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setClaiming(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <Loader2 className="text-zinc-600 animate-spin" size={24} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-zinc-400 text-sm">{error ?? "Invoice not found"}</p>
        </div>
      </div>
    );
  }

  if (data.status === "paid") {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-emerald-500/12 border border-emerald-500/20 flex items-center justify-center mx-auto">
            <CheckCircle2 size={26} className="text-emerald-400" />
          </div>
          <p className="text-zinc-200 font-medium">This invoice has been paid</p>
          <p className="text-zinc-500 text-sm">{data.invoice_number}</p>
        </div>
      </div>
    );
  }

  const upiLink = data.upi_id
    ? `upi://pay?pa=${encodeURIComponent(data.upi_id)}&pn=${encodeURIComponent(data.business_name)}&am=${Number(data.amount).toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Invoice ${data.invoice_number}`)}`
    : null;

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex items-start justify-center p-4 pt-10">
      <div className="w-full max-w-sm space-y-4">
        {/* Header */}
        <div className="text-center mb-6">
          <p className="text-xs text-zinc-600 uppercase tracking-widest mb-1">Payment request from</p>
          <h1 className="text-lg font-semibold text-zinc-100">{data.business_name}</h1>
          <p className="text-xs text-zinc-500 mt-0.5">{data.invoice_number}</p>
        </div>

        {/* Amount card */}
        <div className="rounded-2xl border border-white/8 bg-[#111113] p-6 text-center">
          <p className="text-xs text-zinc-500 mb-1">Amount due</p>
          <p className="text-4xl font-bold text-zinc-50 tracking-tight">
            {formatCurrency(Number(data.amount))}
          </p>
          {data.due_date && (
            <p className="text-xs text-zinc-600 mt-2">Due {data.due_date}</p>
          )}
        </div>

        {/* UPI section */}
        {data.upi_id ? (
          <div className="rounded-2xl border border-white/8 bg-[#111113] p-6 flex flex-col items-center gap-4">
            <p className="text-xs text-zinc-500">Scan with any UPI app</p>
            <div className="bg-white p-3 rounded-xl">
              <QRCodeSVG value={upiLink!} size={160} />
            </div>
            <p className="text-xs text-zinc-400 font-mono">{data.upi_id}</p>

            {upiLink && (
              <a href={upiLink} className="w-full">
                <Button variant="outline" className="w-full gap-2" size="sm">
                  <Smartphone size={14} /> Open UPI App
                </Button>
              </a>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/8 bg-[#111113] p-6 text-center">
            <p className="text-sm text-zinc-400">Contact {data.business_name} for payment details.</p>
          </div>
        )}

        {/* I've Paid button */}
        {claimed ? (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/8 p-5 text-center space-y-1">
            <CheckCircle2 size={20} className="text-emerald-400 mx-auto" />
            <p className="text-sm font-medium text-emerald-300">Payment noted</p>
            <p className="text-xs text-zinc-500">
              We&apos;ve notified {data.business_name}. They&apos;ll confirm shortly.
            </p>
          </div>
        ) : (
          <Button
            className="w-full h-12 text-sm font-medium"
            onClick={handleClaimed}
            disabled={claiming}
          >
            {claiming ? (
              <><Loader2 size={15} className="animate-spin" /> Notifying…</>
            ) : (
              "✓  I've Paid"
            )}
          </Button>
        )}

        <p className="text-center text-[11px] text-zinc-700 pb-6">
          Powered by InvoiceSnap
        </p>
      </div>
    </div>
  );
}
