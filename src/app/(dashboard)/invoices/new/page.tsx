"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  Trash2,
  MessageCircle,
  Download,
  Mail,
  Eye,
  ChevronDown,
  ChevronLeft,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";

type LineItem = {
  id: string;
  description: string;
  qty: number;
  rate: number;
};

const gstRates = [0, 5, 12, 18, 28];

const clients = [
  { id: "1", name: "Sneha Reddy", phone: "+91 98765 43210" },
  { id: "2", name: "Vikram Events", phone: "+91 97654 32109" },
  { id: "3", name: "Meera Tutoring", phone: "+91 96543 21098" },
  { id: "4", name: "Arjun Nair Design", phone: "+91 95432 10987" },
  { id: "5", name: "Priya Photography", phone: "+91 94321 09876" },
];

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export default function NewInvoicePage() {
  const [items, setItems] = useState<LineItem[]>([
    { id: uid(), description: "", qty: 1, rate: 0 },
  ]);
  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstRate, setGstRate] = useState(18);
  const [selectedClient, setSelectedClient] = useState("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showGstDropdown, setShowGstDropdown] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [notes, setNotes] = useState("");

  const updateItem = useCallback((id: string, field: keyof LineItem, value: string | number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  }, []);

  const addItem = () =>
    setItems((prev) => [...prev, { id: uid(), description: "", qty: 1, rate: 0 }]);

  const removeItem = (id: string) =>
    setItems((prev) => prev.filter((item) => item.id !== id));

  const subtotal = items.reduce((sum, item) => sum + item.qty * item.rate, 0);
  const gstAmount = gstEnabled ? (subtotal * gstRate) / 100 : 0;
  const total = subtotal + gstAmount;

  const clientObj = clients.find((c) => c.id === selectedClient);

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-7">
        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
          <Link href="/invoices"><ChevronLeft size={16} /></Link>
        </Button>
        <div>
          <h1 className="font-display text-2xl font-semibold text-zinc-50">New Invoice</h1>
          <p className="text-xs text-zinc-500">Invoice #INV-2025-043 will be assigned on save</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
            <Eye size={14} /> Preview
          </Button>
          <Button variant="secondary" size="sm">Save draft</Button>
          <Button size="sm">
            Save &amp; send
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-5">
          {/* Client selector */}
          <div className="rounded-xl border border-white/8 bg-[#111113] p-5">
            <h2 className="text-sm font-semibold text-zinc-200 mb-4">Bill to</h2>
            <div className="relative">
              <button
                onClick={() => setShowClientDropdown(!showClientDropdown)}
                className="w-full flex items-center justify-between rounded-lg border border-white/8 bg-zinc-900/60 px-3 py-2.5 text-sm text-left transition-colors hover:border-white/15"
              >
                {clientObj ? (
                  <div>
                    <p className="text-zinc-100 font-medium">{clientObj.name}</p>
                    <p className="text-xs text-zinc-500">{clientObj.phone}</p>
                  </div>
                ) : (
                  <span className="text-zinc-500">Select a client…</span>
                )}
                <ChevronDown size={15} className="text-zinc-500 shrink-0" />
              </button>

              {showClientDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 z-20 rounded-lg border border-white/10 bg-zinc-900 shadow-xl overflow-hidden">
                  {clients.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedClient(c.id); setShowClientDropdown(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                    >
                      <div className="w-7 h-7 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-xs font-semibold text-emerald-400 shrink-0">
                        {c.name[0]}
                      </div>
                      <div>
                        <p className="text-sm text-zinc-200">{c.name}</p>
                        <p className="text-xs text-zinc-500">{c.phone}</p>
                      </div>
                    </button>
                  ))}
                  <button
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-emerald-400 hover:bg-emerald-500/5 transition-colors border-t border-white/7"
                    onClick={() => setShowClientDropdown(false)}
                  >
                    <Plus size={14} /> Add new client
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Invoice details */}
          <div className="rounded-xl border border-white/8 bg-[#111113] p-5">
            <h2 className="text-sm font-semibold text-zinc-200 mb-4">Invoice details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Invoice date</Label>
                <Input type="date" defaultValue="2025-05-01" />
              </div>
              <div className="space-y-1.5">
                <Label>Due date</Label>
                <Input type="date" defaultValue="2025-05-15" />
              </div>
            </div>
          </div>

          {/* Line items */}
          <div className="rounded-xl border border-white/8 bg-[#111113] p-5">
            <h2 className="text-sm font-semibold text-zinc-200 mb-4">Line items</h2>

            {/* Column headers */}
            <div className="grid grid-cols-[1fr_80px_110px_32px] gap-3 mb-2 px-1">
              <span className="text-[11px] text-zinc-600 uppercase tracking-wide">Description</span>
              <span className="text-[11px] text-zinc-600 uppercase tracking-wide text-center">Qty</span>
              <span className="text-[11px] text-zinc-600 uppercase tracking-wide text-right">Rate (₹)</span>
              <span />
            </div>

            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="grid grid-cols-[1fr_80px_110px_32px] gap-3 items-center">
                  <Input
                    placeholder="e.g. Wedding Photography"
                    value={item.description}
                    onChange={(e) => updateItem(item.id, "description", e.target.value)}
                  />
                  <Input
                    type="number"
                    min="1"
                    value={item.qty}
                    onChange={(e) => updateItem(item.id, "qty", parseFloat(e.target.value) || 0)}
                    className="text-center"
                  />
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">₹</span>
                    <Input
                      type="number"
                      min="0"
                      value={item.rate || ""}
                      placeholder="0"
                      onChange={(e) => updateItem(item.id, "rate", parseFloat(e.target.value) || 0)}
                      className="pl-7 text-right"
                    />
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                    className="h-9 w-9 rounded-lg flex items-center justify-center text-zinc-600 hover:text-red-400 hover:bg-red-500/8 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={addItem}
              className="mt-3 flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <Plus size={14} /> Add item
            </button>
          </div>

          {/* GST */}
          <div className="rounded-xl border border-white/8 bg-[#111113] p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-zinc-200">GST</h2>
                <Info size={13} className="text-zinc-600" />
              </div>
              <button
                onClick={() => setGstEnabled(!gstEnabled)}
                className={`relative w-9 h-5 rounded-full transition-colors ${gstEnabled ? "bg-emerald-500" : "bg-zinc-700"}`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${gstEnabled ? "translate-x-4" : "translate-x-0.5"}`}
                />
              </button>
            </div>

            {gstEnabled && (
              <div className="space-y-3">
                <div className="relative">
                  <button
                    onClick={() => setShowGstDropdown(!showGstDropdown)}
                    className="w-full flex items-center justify-between rounded-lg border border-white/8 bg-zinc-900/60 px-3 py-2 text-sm"
                  >
                    <span className="text-zinc-200">GST {gstRate}%</span>
                    <ChevronDown size={14} className="text-zinc-500" />
                  </button>
                  {showGstDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-10 rounded-lg border border-white/10 bg-zinc-900 shadow-xl overflow-hidden">
                      {gstRates.map((rate) => (
                        <button
                          key={rate}
                          onClick={() => { setGstRate(rate); setShowGstDropdown(false); }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-white/5 ${gstRate === rate ? "text-emerald-400" : "text-zinc-300"}`}
                        >
                          {rate === 0 ? "0% (Exempt)" : `${rate}%`}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-zinc-600 flex items-center gap-1">
                  <Info size={11} /> CGST {gstRate / 2}% + SGST {gstRate / 2}% for intra-state
                </p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="rounded-xl border border-white/8 bg-[#111113] p-5">
            <h2 className="text-sm font-semibold text-zinc-200 mb-3">Notes (optional)</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Payment terms, bank details, or a thank-you note…"
              rows={3}
              className="w-full rounded-lg border border-white/8 bg-zinc-900/60 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 resize-none focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/15 transition-colors"
            />
          </div>
        </div>

        {/* Right: Summary */}
        <div className="space-y-4">
          {/* Totals card */}
          <div className="rounded-xl border border-white/8 bg-[#111113] p-5 sticky top-6">
            <h2 className="text-sm font-semibold text-zinc-200 mb-4">Summary</h2>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Subtotal</span>
                <span className="text-zinc-200 font-medium">{formatCurrency(subtotal)}</span>
              </div>
              {gstEnabled && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">GST ({gstRate}%)</span>
                  <span className="text-zinc-200 font-medium">{formatCurrency(gstAmount)}</span>
                </div>
              )}
              <div className="border-t border-white/7 pt-3 flex justify-between">
                <span className="text-sm font-semibold text-zinc-200">Total</span>
                <span className="font-display text-2xl font-semibold text-zinc-50">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <Button className="w-full" size="lg">
                Save &amp; send
              </Button>
              <Button variant="whatsapp" className="w-full" size="lg">
                <MessageCircle size={16} /> Send on WhatsApp
              </Button>
              <Button variant="outline" className="w-full" size="sm">
                <Mail size={14} /> Send via Email
              </Button>
              <Button variant="outline" className="w-full" size="sm">
                <Download size={14} /> Download PDF
              </Button>
            </div>

            <p className="mt-3 text-[11px] text-zinc-600 text-center">
              A Razorpay payment link will be created automatically
            </p>
          </div>

          {/* Tips card */}
          <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-4">
            <p className="text-xs font-medium text-emerald-400 mb-2">💡 Pro tip</p>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Adding your GST number on the profile page unlocks GST-compliant invoices that your clients can claim input tax credit on.
            </p>
          </div>
        </div>
      </div>

      {/* Preview modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#111113] shadow-2xl">
            {/* Preview header */}
            <div className="flex items-center justify-between p-5 border-b border-white/7">
              <h2 className="font-display text-lg font-semibold text-zinc-100">Invoice Preview</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="text-zinc-500 hover:text-zinc-200 transition-colors text-xl leading-none"
              >×</button>
            </div>

            {/* Invoice preview body */}
            <div className="p-8">
              {/* Header */}
              <div className="flex justify-between mb-8">
                <div>
                  <div className="font-display text-xl font-semibold text-zinc-50 mb-1">Rahul Photography</div>
                  <div className="text-xs text-zinc-500 space-y-0.5">
                    <p>rahul@rahulphoto.in</p>
                    <p>+91 98765 43210</p>
                    <p>Bengaluru, Karnataka</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-3xl font-semibold text-zinc-50 mb-1">INVOICE</div>
                  <div className="text-xs text-zinc-500 space-y-0.5">
                    <p className="text-emerald-400 font-medium">#INV-2025-043</p>
                    <p>Date: 01 May 2025</p>
                    <p>Due: 15 May 2025</p>
                  </div>
                </div>
              </div>

              {/* Bill to */}
              <div className="mb-6 p-4 rounded-lg bg-zinc-900/50 border border-white/5">
                <p className="text-[11px] text-zinc-500 uppercase tracking-wide mb-1">Bill to</p>
                <p className="text-sm font-semibold text-zinc-200">{clientObj?.name || "— Select a client —"}</p>
                {clientObj && <p className="text-xs text-zinc-500">{clientObj.phone}</p>}
              </div>

              {/* Items table */}
              <table className="w-full text-sm mb-6">
                <thead>
                  <tr className="border-b border-white/10 text-[11px] text-zinc-500 uppercase tracking-wide">
                    <th className="text-left pb-2">Description</th>
                    <th className="text-center pb-2">Qty</th>
                    <th className="text-right pb-2">Rate</th>
                    <th className="text-right pb-2">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {items.filter(i => i.description || i.rate > 0).map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 text-zinc-200">{item.description || "—"}</td>
                      <td className="py-3 text-center text-zinc-400">{item.qty}</td>
                      <td className="py-3 text-right text-zinc-400">{formatCurrency(item.rate)}</td>
                      <td className="py-3 text-right font-medium text-zinc-200">{formatCurrency(item.qty * item.rate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end mb-8">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Subtotal</span>
                    <span className="text-zinc-200">{formatCurrency(subtotal)}</span>
                  </div>
                  {gstEnabled && (
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">GST ({gstRate}%)</span>
                      <span className="text-zinc-200">{formatCurrency(gstAmount)}</span>
                    </div>
                  )}
                  <div className="border-t border-white/10 pt-2 flex justify-between font-semibold">
                    <span className="text-zinc-200">Total</span>
                    <span className="text-emerald-400 font-display text-lg">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              {notes && (
                <div className="border-t border-white/7 pt-4">
                  <p className="text-[11px] text-zinc-500 uppercase tracking-wide mb-1">Notes</p>
                  <p className="text-xs text-zinc-400">{notes}</p>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-white/7 flex gap-3">
              <Button className="flex-1" variant="whatsapp">
                <MessageCircle size={15} /> Send on WhatsApp
              </Button>
              <Button className="flex-1" variant="outline">
                <Download size={15} /> Download PDF
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
