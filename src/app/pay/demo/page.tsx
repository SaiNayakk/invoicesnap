"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle2, Smartphone, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const DEMO = {
  invoice_number: "INV-2025-043",
  amount:         62540,
  due_date:       "15 May 2025",
  business_name:  "Rahul Photography",
  upi_id:         "sai34nayak@okaxis",
};

export default function DemoPayPage() {
  const [claimed, setClaimed] = useState(false);

  const upiLink =
    `upi://pay?pa=${encodeURIComponent(DEMO.upi_id)}` +
    `&pn=${encodeURIComponent(DEMO.business_name)}` +
    `&am=${DEMO.amount.toFixed(2)}&cu=INR` +
    `&tn=${encodeURIComponent(`Invoice ${DEMO.invoice_number}`)}`;

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex items-start justify-center p-4 pt-10">
      <div className="w-full max-w-sm space-y-4">
        {/* Demo banner */}
        <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 px-4 py-2 text-center">
          <p className="text-xs text-blue-400 font-medium">Demo invoice — no real payment will be made</p>
        </div>

        {/* Header */}
        <div className="text-center mb-2">
          <p className="text-xs text-zinc-600 uppercase tracking-widest mb-1">Payment request from</p>
          <h1 className="text-lg font-semibold text-zinc-100">{DEMO.business_name}</h1>
          <p className="text-xs text-zinc-500 mt-0.5">{DEMO.invoice_number}</p>
        </div>

        {/* Amount */}
        <div className="rounded-2xl border border-white/8 bg-[#111113] p-6 text-center">
          <p className="text-xs text-zinc-500 mb-1">Amount due</p>
          <p className="text-4xl font-bold text-zinc-50 tracking-tight">
            ₹{DEMO.amount.toLocaleString("en-IN")}
          </p>
          <p className="text-xs text-zinc-600 mt-2">Due {DEMO.due_date}</p>
        </div>

        {/* UPI QR */}
        <div className="rounded-2xl border border-white/8 bg-[#111113] p-6 flex flex-col items-center gap-4">
          <p className="text-xs text-zinc-500">Scan with any UPI app</p>
          <div className="bg-white p-3 rounded-xl">
            <QRCodeSVG value={upiLink} size={160} />
          </div>
          <p className="text-xs text-zinc-400 font-mono">{DEMO.upi_id}</p>
          <a href={upiLink} className="w-full">
            <Button variant="outline" className="w-full gap-2" size="sm">
              <Smartphone size={14} /> Open UPI App
            </Button>
          </a>
        </div>

        {/* PDF link */}
        <a href="/api/demo/pdf" target="_blank" rel="noopener noreferrer" className="w-full">
          <Button variant="outline" className="w-full gap-2" size="sm">
            <FileText size={14} /> View Invoice PDF
          </Button>
        </a>

        {/* I've Paid */}
        {claimed ? (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/8 p-5 text-center space-y-1">
            <CheckCircle2 size={20} className="text-emerald-400 mx-auto" />
            <p className="text-sm font-medium text-emerald-300">Payment noted</p>
            <p className="text-xs text-zinc-500">
              We&apos;ve notified {DEMO.business_name}. They&apos;ll confirm shortly.
            </p>
          </div>
        ) : (
          <Button className="w-full h-12 text-sm font-medium" onClick={() => setClaimed(true)}>
            ✓  I&apos;ve Paid
          </Button>
        )}

        <p className="text-center text-[11px] text-zinc-700 pb-6">Powered by InvoiceSnap</p>
      </div>
    </div>
  );
}
