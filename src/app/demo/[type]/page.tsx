"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft, ChevronRight, X, Check, MessageCircle, FileText,
  IndianRupee, AlertCircle, CheckCircle2, Clock, TrendingUp, Plus,
  Users, BarChart3, ArrowRight, Zap, Database, Code2, Globe,
  Webhook, Terminal, ExternalLink, Copy, Download,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";

// ─── Shared helpers ──────────────────────────────────────────────────────────

function formatCurrency(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

type InvoiceStatus = "paid" | "sent" | "draft" | "overdue";

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; color: string; bg: string; border: string }> = {
  paid:    { label: "Paid",    color: "text-emerald-400", bg: "bg-emerald-500/12", border: "border-emerald-500/20" },
  sent:    { label: "Sent",    color: "text-amber-400",   bg: "bg-amber-500/12",   border: "border-amber-500/20"   },
  draft:   { label: "Draft",   color: "text-zinc-400",    bg: "bg-zinc-700/30",    border: "border-zinc-600/30"    },
  overdue: { label: "Overdue", color: "text-red-400",     bg: "bg-red-500/12",     border: "border-red-500/20"     },
};

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const s = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${s.bg} ${s.color} border ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.color.replace("text-", "bg-")} inline-block`} />
      {s.label}
    </span>
  );
}

const INVOICES = [
  { id: "1", number: "INV-2025-042", client: "Sneha Reddy",      init: "S", amount: 45000, status: "paid"    as InvoiceStatus, date: "28 Apr", due: "30 Apr" },
  { id: "2", number: "INV-2025-041", client: "Vikram Events",    init: "V", amount: 72000, status: "sent"    as InvoiceStatus, date: "26 Apr", due: "10 May" },
  { id: "3", number: "INV-2025-040", client: "Meera Tutoring",   init: "M", amount: 18000, status: "overdue" as InvoiceStatus, date: "15 Apr", due: "25 Apr" },
  { id: "4", number: "INV-2025-039", client: "Arjun Nair Design",init: "A", amount: 38500, status: "sent"    as InvoiceStatus, date: "22 Apr", due: "5 May"  },
  { id: "5", number: "INV-2025-038", client: "Priya Photography",init: "P", amount: 62000, status: "paid"    as InvoiceStatus, date: "18 Apr", due: "22 Apr" },
];

const CLIENTS = [
  { name: "Priya Photography",  gst: "29AADCP7742R1Z5", phone: "+91 98765 43210", invoices: 8,  total: 384000 },
  { name: "Vikram Events",      gst: "27AAACV2345F1ZD", phone: "+91 97654 32109", invoices: 12, total: 864000 },
  { name: "Sneha Reddy",        gst: null,               phone: "+91 96543 21098", invoices: 5,  total: 148000 },
  { name: "Meera Tutoring",     gst: null,               phone: "+91 95432 10987", invoices: 3,  total: 54000  },
];

// ─── Product demo panels ──────────────────────────────────────────────────────

function PanelDashboard() {
  const stats = [
    { label: "Outstanding", value: "₹1,48,500", sub: "12 invoices", icon: IndianRupee, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/15" },
    { label: "Paid This Month", value: "₹82,300",  sub: "8 invoices",  icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/15" },
    { label: "Sent",  value: "23",      sub: "this month",   icon: FileText,     color: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/15"    },
    { label: "Overdue",       value: "4",        sub: "₹38,200 at risk", icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/15" },
  ];
  return (
    <div className="h-full overflow-auto p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-zinc-50">Good morning, Rahul 👋</h1>
          <p className="text-xs text-zinc-500">Here&apos;s what&apos;s happening with your invoices today.</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold">
          <Plus size={13} /> New Invoice
        </button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(({ label, value, sub, icon: Icon, color, bg, border }) => (
          <div key={label} className={`rounded-xl border border-white/8 bg-[#111113] p-4`}>
            <div className={`w-8 h-8 rounded-lg ${bg} border ${border} flex items-center justify-center mb-3`}>
              <Icon size={15} className={color} />
            </div>
            <p className="text-lg font-semibold text-zinc-100">{value}</p>
            <p className="text-xs text-zinc-500">{label}</p>
            <p className="text-[10px] text-zinc-600 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-white/8 bg-[#111113]">
        <div className="px-4 py-3 border-b border-white/7 flex items-center justify-between">
          <p className="text-sm font-semibold text-zinc-200">Recent Invoices</p>
          <span className="text-xs text-zinc-500">Your last 5 invoices</span>
        </div>
        <div className="divide-y divide-white/5">
          {INVOICES.map(inv => (
            <div key={inv.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/2 transition-colors">
              <div className="w-7 h-7 rounded-full bg-emerald-500/12 border border-emerald-500/15 flex items-center justify-center text-xs font-semibold text-emerald-400 shrink-0">{inv.init}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-200 truncate">{inv.client}</p>
                <p className="text-xs text-zinc-600">{inv.number} · Due {inv.due}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-zinc-200">{formatCurrency(inv.amount)}</p>
                <StatusBadge status={inv.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PanelCreateInvoice() {
  const [gst, setGst] = useState(true);
  const subtotal = 45000 + 8000;
  const gstAmt = gst ? Math.round(subtotal * 0.18) : 0;
  const total = subtotal + gstAmt;
  return (
    <div className="h-full overflow-auto p-5">
      <div className="flex items-center gap-3 mb-5">
        <ChevronLeft size={16} className="text-zinc-400" />
        <div>
          <h1 className="font-display text-xl font-semibold text-zinc-50">New Invoice</h1>
          <p className="text-xs text-zinc-500">INV-2025-043 · Draft</p>
        </div>
      </div>
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Left */}
        <div className="space-y-4">
          <div className="rounded-xl border border-white/8 bg-[#111113] p-4 space-y-3">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Client</p>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/8 border border-emerald-500/20">
              <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center text-sm font-semibold text-emerald-400">P</div>
              <div>
                <p className="text-sm font-medium text-zinc-200">Priya Photography</p>
                <p className="text-xs text-zinc-500">+91 98765 43210 · GST: 29AADCP7742R1Z5</p>
              </div>
              <Check size={14} className="ml-auto text-emerald-400" />
            </div>
          </div>
          <div className="rounded-xl border border-white/8 bg-[#111113] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Line Items</p>
              <button className="text-xs text-emerald-400 flex items-center gap-1"><Plus size={11} />Add item</button>
            </div>
            {[
              { desc: "Wedding Photography", qty: 1, rate: 45000 },
              { desc: "Photo Album (Premium)", qty: 1, rate: 8000 },
            ].map((item, i) => (
              <div key={i} className="grid grid-cols-[1fr_60px_80px] gap-2 items-center">
                <div className="bg-zinc-900 rounded-lg px-3 py-2 text-sm text-zinc-200">{item.desc}</div>
                <div className="bg-zinc-900 rounded-lg px-2 py-2 text-sm text-zinc-200 text-center">{item.qty}</div>
                <div className="bg-zinc-900 rounded-lg px-2 py-2 text-sm text-zinc-200 text-right">₹{item.rate.toLocaleString("en-IN")}</div>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-white/8 bg-[#111113] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-200">GST (18%)</p>
                <p className="text-xs text-zinc-500">Goods &amp; Services Tax</p>
              </div>
              <button
                onClick={() => setGst(!gst)}
                className={`w-10 h-5.5 rounded-full transition-colors relative flex items-center px-0.5 ${gst ? "bg-emerald-500" : "bg-zinc-700"}`}
                style={{ height: "22px" }}
              >
                <span className={`w-4 h-4 rounded-full bg-white transition-transform shadow ${gst ? "translate-x-4.5" : ""}`} style={{ transform: gst ? "translateX(18px)" : "translateX(0)" }} />
              </button>
            </div>
          </div>
        </div>
        {/* Right – summary */}
        <div className="space-y-4">
          <div className="rounded-xl border border-white/8 bg-[#111113] p-4 space-y-2.5">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Summary</p>
            <div className="flex justify-between text-sm"><span className="text-zinc-400">Subtotal</span><span className="text-zinc-200">{formatCurrency(subtotal)}</span></div>
            {gst && <div className="flex justify-between text-sm"><span className="text-zinc-400">GST (18%)</span><span className="text-zinc-200">{formatCurrency(gstAmt)}</span></div>}
            <div className="border-t border-white/7 pt-2.5 flex justify-between">
              <span className="font-semibold text-zinc-200">Total</span>
              <span className="font-display text-xl font-bold text-zinc-50">{formatCurrency(total)}</span>
            </div>
          </div>
          <div className="rounded-xl border border-white/8 bg-[#111113] p-4 space-y-2">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Due Date</p>
            <div className="bg-zinc-900 rounded-lg px-3 py-2 text-sm text-zinc-200 flex justify-between">
              <span>15 May 2025</span>
              <span className="text-zinc-500">30 days</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-300 border border-white/8">
              <FileText size={13} /> Save Draft
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white">
              <Check size={13} /> Finalise Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PanelWhatsApp() {
  const [sent, setSent] = useState(false);
  return (
    <div className="h-full overflow-auto p-5 flex flex-col gap-5">
      {/* Invoice card */}
      <div className="rounded-xl border border-white/8 bg-[#111113] p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-zinc-500">INV-2025-043</p>
            <p className="font-display text-lg font-semibold text-zinc-100">Priya Photography</p>
          </div>
          <StatusBadge status={sent ? "sent" : "draft"} />
        </div>
        <div className="flex justify-between text-sm border-t border-white/7 pt-4">
          <span className="text-zinc-400">Wedding Photography + Album + GST</span>
          <span className="font-display text-xl font-bold text-zinc-50">₹62,540</span>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: FileText,      label: "Download PDF", color: "text-zinc-400 bg-zinc-800 border-white/8" },
          { icon: MessageCircle, label: "Send WhatsApp", color: "text-white bg-[#25D366] border-[#20bd5a]/40", action: true },
          { icon: Download,      label: "Copy Link",    color: "text-zinc-400 bg-zinc-800 border-white/8" },
        ].map(({ icon: Icon, label, color, action }) => (
          <button
            key={label}
            onClick={action ? () => setSent(true) : undefined}
            className={`flex flex-col items-center justify-center gap-2 py-4 rounded-xl border text-xs font-medium transition-all active:scale-95 ${color} ${action && !sent ? "ring-2 ring-[#25D366]/40 shadow-lg shadow-[#25D366]/10" : ""}`}
          >
            <Icon size={18} />
            {action && sent ? "Sent ✓" : label}
          </button>
        ))}
      </div>

      {/* WhatsApp preview */}
      <div className="rounded-xl border border-white/8 bg-[#111113] p-4">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">WhatsApp Preview</p>
        <div className="rounded-xl bg-[#0a1a0e] border border-[#25D366]/15 p-4 space-y-3">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center text-sm font-bold text-emerald-400">IS</div>
            <div>
              <p className="text-sm font-semibold text-zinc-100">InvoiceSnap</p>
              <p className="text-xs text-zinc-500">Business Account</p>
            </div>
          </div>
          {/* Message bubble */}
          <div className="bg-[#1a2f1a] rounded-xl p-3 text-xs text-zinc-300 space-y-1.5 leading-relaxed">
            <p>Hello Priya! 👋</p>
            <p>Your invoice <span className="text-emerald-400 font-medium">INV-2025-043</span> for <span className="font-medium">₹62,540</span> is ready.</p>
            <p className="text-zinc-500">Due: 15 May 2025</p>
            <div className="mt-2 pt-2 border-t border-white/10">
              <div className="flex items-center gap-2 text-[#25D366] font-medium">
                <ExternalLink size={11} />
                Pay ₹62,540 via Razorpay →
              </div>
            </div>
          </div>
          {sent && (
            <div className="flex items-center gap-2 text-emerald-400 text-xs">
              <Check size={12} />
              Message delivered to +91 98765 43210
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PanelPaymentTracking() {
  const [highlighted, setHighlighted] = useState<string | null>("2");
  return (
    <div className="h-full overflow-auto p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold text-zinc-50">Invoices</h1>
        <div className="flex gap-2">
          {["All", "Sent", "Paid", "Overdue"].map(f => (
            <button key={f} className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${f === "All" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25" : "text-zinc-500 hover:text-zinc-300"}`}>{f}</button>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-white/8 bg-[#111113] divide-y divide-white/5">
        {INVOICES.map(inv => (
          <div
            key={inv.id}
            onClick={() => setHighlighted(inv.id)}
            className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors ${highlighted === inv.id ? "bg-emerald-500/5 border-l-2 border-emerald-500" : "hover:bg-white/2"}`}
          >
            <div className="w-7 h-7 rounded-full bg-emerald-500/12 border border-emerald-500/15 flex items-center justify-center text-xs font-semibold text-emerald-400 shrink-0">{inv.init}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-200 truncate">{inv.client}</p>
              <p className="text-xs text-zinc-600">{inv.number}</p>
            </div>
            <div className="text-right shrink-0 space-y-0.5">
              <p className="text-sm font-medium text-zinc-200">{formatCurrency(inv.amount)}</p>
              <StatusBadge status={inv.status} />
            </div>
            {inv.status !== "paid" && (
              <button className="h-7 w-7 rounded-md bg-[#25D366]/12 border border-[#25D366]/20 flex items-center justify-center text-[#25D366] hover:bg-[#25D366]/25 transition-colors shrink-0">
                <MessageCircle size={12} />
              </button>
            )}
          </div>
        ))}
      </div>
      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Paid",    count: "₹1,07,000", color: "text-emerald-400", dot: "bg-emerald-500" },
          { label: "Sent",    count: "₹1,10,500", color: "text-amber-400",   dot: "bg-amber-500"   },
          { label: "Overdue", count: "₹38,200",   color: "text-red-400",     dot: "bg-red-500"     },
          { label: "Draft",   count: "₹77,500",   color: "text-zinc-400",    dot: "bg-zinc-600"    },
        ].map(({ label, count, color, dot }) => (
          <div key={label} className="rounded-lg bg-[#111113] border border-white/7 p-3 text-center">
            <div className={`w-2 h-2 rounded-full ${dot} mx-auto mb-1.5`} />
            <p className={`text-xs font-semibold ${color}`}>{count}</p>
            <p className="text-[10px] text-zinc-600 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PanelClients() {
  return (
    <div className="h-full overflow-auto p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold text-zinc-50">Clients</h1>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold">
          <Plus size={13} /> Add Client
        </button>
      </div>
      <div className="grid gap-3">
        {CLIENTS.map(c => (
          <div key={c.name} className="rounded-xl border border-white/8 bg-[#111113] p-4 flex items-center gap-4 hover:border-white/15 transition-colors">
            <div className="w-10 h-10 rounded-full bg-emerald-500/12 border border-emerald-500/20 flex items-center justify-center text-sm font-bold text-emerald-400 shrink-0">
              {c.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-zinc-200">{c.name}</p>
              <p className="text-xs text-zinc-500">{c.phone}</p>
              {c.gst && <p className="text-[10px] text-zinc-600 mt-0.5">GST: {c.gst}</p>}
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-semibold text-zinc-100">{formatCurrency(c.total)}</p>
              <p className="text-xs text-zinc-500">{c.invoices} invoices</p>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-center gap-3">
        <Zap size={15} className="text-emerald-400 shrink-0" />
        <p className="text-xs text-zinc-300">
          Client details auto-fill on every new invoice — name, phone, and GST number pre-populated.
        </p>
      </div>
    </div>
  );
}

function PanelAnalytics() {
  const months = ["Jan","Feb","Mar","Apr"];
  const vals = [38, 62, 45, 89];
  return (
    <div className="h-full overflow-auto p-5 space-y-4">
      <h1 className="font-display text-xl font-semibold text-zinc-50">Analytics</h1>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Revenue this month", value: "₹82,300", trend: "+18%", color: "text-emerald-400" },
          { label: "Avg collection time", value: "4.2 days", trend: "-2d", color: "text-emerald-400" },
          { label: "Invoice send rate", value: "94%", trend: "+3%", color: "text-emerald-400" },
          { label: "Outstanding total", value: "₹1,48,500", trend: "12 invoices", color: "text-amber-400" },
        ].map(({ label, value, trend, color }) => (
          <div key={label} className="rounded-xl border border-white/8 bg-[#111113] p-4">
            <p className="text-xs text-zinc-500 mb-1">{label}</p>
            <p className="text-xl font-display font-bold text-zinc-50">{value}</p>
            <p className={`text-xs ${color} mt-1`}>{trend}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-white/8 bg-[#111113] p-4">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">Monthly Revenue</p>
        <div className="flex items-end gap-3 h-24">
          {vals.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs text-zinc-500">{formatCurrency(v * 1000)}</span>
              <div
                className="w-full rounded-t-sm bg-emerald-500/30 hover:bg-emerald-500/60 transition-colors"
                style={{ height: `${v}%` }}
              />
              <span className="text-[10px] text-zinc-600">{months[i]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Technical demo panels ────────────────────────────────────────────────────

function CodeBlock({ code, lang = "typescript" }: { code: string; lang?: string }) {
  return (
    <div className="rounded-xl bg-zinc-950 border border-white/8 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/7 bg-[#0c0c0e]">
        <span className="text-xs text-zinc-500 font-mono">{lang}</span>
        <button className="text-zinc-600 hover:text-zinc-300 transition-colors"><Copy size={12} /></button>
      </div>
      <pre className="p-4 text-xs leading-relaxed overflow-x-auto">
        <code className="text-zinc-300 font-mono">{code}</code>
      </pre>
    </div>
  );
}

function TechBadge({ label, color }: { label: string; color: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${color}`}>
      {label}
    </span>
  );
}

function PanelTechStack() {
  const layers = [
    {
      title: "Frontend", color: "border-blue-500/30 bg-blue-500/5",
      items: [
        { label: "Next.js 16", note: "App Router, Server Components, Turbopack" },
        { label: "Tailwind CSS v4", note: "Utility-first, dark theme with CSS vars" },
        { label: "shadcn/ui", note: "Radix-based accessible component primitives" },
      ],
    },
    {
      title: "Backend", color: "border-emerald-500/30 bg-emerald-500/5",
      items: [
        { label: "PocketBase 0.26", note: "SQLite-backed, self-hosted BaaS with real-time" },
        { label: "Next.js API Routes", note: "Edge-compatible, deployed alongside the app" },
        { label: "PDFKit", note: "Programmatic PDF generation, streamed to client" },
      ],
    },
    {
      title: "Integrations", color: "border-amber-500/30 bg-amber-500/5",
      items: [
        { label: "Razorpay", note: "Payment links + webhook for status sync" },
        { label: "WhatsApp Cloud API", note: "Meta Business API for message delivery" },
        { label: "Resend", note: "Transactional email for invoice copies" },
      ],
    },
  ];
  return (
    <div className="h-full overflow-auto p-5 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Terminal size={16} className="text-emerald-400" />
        <h2 className="font-display text-xl font-semibold text-zinc-50">Tech Stack</h2>
      </div>
      {layers.map(({ title, color, items }) => (
        <div key={title} className={`rounded-xl border ${color} p-4 space-y-3`}>
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{title}</p>
          <div className="space-y-2">
            {items.map(({ label, note }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-zinc-500 mt-1.5 shrink-0" />
                <div>
                  <span className="text-sm font-semibold text-zinc-200">{label}</span>
                  <p className="text-xs text-zinc-500 mt-0.5">{note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        {["TypeScript", "pnpm", "Turbopack", "Deployed on GCP VM", "PM2", "Nginx"].map(t => (
          <TechBadge key={t} label={t} color="border-zinc-700 text-zinc-400 bg-zinc-900" />
        ))}
      </div>
    </div>
  );
}

function PanelDataModel() {
  const collections = [
    { name: "users",         fields: ["id", "email", "name", "plan: free|pro|business", "created"] },
    { name: "clients",       fields: ["id", "user_id (text)", "name", "phone", "gst_number", "email"] },
    { name: "invoices",      fields: ["id", "user_id", "client_id", "number", "status", "due_date", "subtotal", "gst_amount", "total", "razorpay_link_id", "razorpay_payment_id"] },
    { name: "invoice_items", fields: ["id", "invoice_id (text)", "description", "quantity", "rate", "amount"] },
  ];
  return (
    <div className="h-full overflow-auto p-5 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Database size={16} className="text-emerald-400" />
        <h2 className="font-display text-xl font-semibold text-zinc-50">Data Model</h2>
        <TechBadge label="PocketBase / SQLite" color="border-emerald-500/30 text-emerald-400 bg-emerald-500/8" />
      </div>
      <p className="text-xs text-zinc-500 leading-relaxed">PocketBase provides typed collections with auto-generated REST/realtime APIs. All foreign keys are plain text fields (not relations) for simplicity.</p>
      {collections.map(col => (
        <div key={col.name} className="rounded-xl border border-white/8 bg-[#111113] overflow-hidden">
          <div className="px-4 py-2.5 bg-zinc-900/50 border-b border-white/7 flex items-center gap-2">
            <Database size={12} className="text-zinc-500" />
            <span className="text-sm font-mono font-semibold text-zinc-200">{col.name}</span>
          </div>
          <div className="p-3 flex flex-wrap gap-1.5">
            {col.fields.map(f => (
              <span key={f} className="px-2 py-0.5 rounded-md bg-zinc-800 text-xs font-mono text-zinc-400 border border-zinc-700/60">{f}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PanelInvoiceAPI() {
  const code = `// POST /api/invoices
export async function POST(req: NextRequest) {
  const pb = await createPBAdminClient();
  const userId = await getUserId(req);
  const { clientId, items, dueDate, applyGst } = await req.json();

  // Calculate totals
  const subtotal = items.reduce((s, i) => s + i.qty * i.rate, 0);
  const gstAmount = applyGst ? Math.round(subtotal * 0.18) : 0;
  const total = subtotal + gstAmount;

  // Auto-increment invoice number
  const count = await pb.collection("invoices").getList(1, 1, {
    filter: \`user_id = "\${userId}"\`,
    sort: "-created",
  });
  const number = \`INV-\${new Date().getFullYear()}-\${
    String(count.totalItems + 1).padStart(3, "0")}\`;

  // Create invoice + line items in parallel
  const invoice = await pb.collection("invoices").create({
    user_id: userId, client_id: clientId, number,
    status: "draft", due_date: dueDate,
    subtotal, gst_amount: gstAmount, total,
  });

  await Promise.all(items.map(item =>
    pb.collection("invoice_items").create({
      invoice_id: invoice.id, ...item,
      amount: item.qty * item.rate,
    })
  ));

  return Response.json({ invoice });
}`;
  return (
    <div className="h-full overflow-auto p-5 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Code2 size={16} className="text-blue-400" />
        <h2 className="font-display text-xl font-semibold text-zinc-50">Invoice API</h2>
        <TechBadge label="POST /api/invoices" color="border-blue-500/30 text-blue-400 bg-blue-500/8" />
      </div>
      <p className="text-xs text-zinc-500">Next.js Route Handler. Creates the invoice record + line items in PocketBase. Auto-increments invoice number from existing count.</p>
      <CodeBlock code={code} />
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Validation", note: "Zod schema on body" },
          { label: "Auto-number", note: "INV-YYYY-NNN" },
          { label: "Parallel writes", note: "Promise.all items" },
        ].map(({ label, note }) => (
          <div key={label} className="rounded-lg border border-white/7 bg-[#111113] p-3 text-center">
            <p className="text-xs font-semibold text-zinc-300">{label}</p>
            <p className="text-[10px] text-zinc-600 mt-0.5">{note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PanelPDF() {
  const code = `// GET /api/invoices/[id]/pdf
export async function GET(req, { params }) {
  const pb = await createPBAdminClient();

  // Fetch invoice + items + client in parallel
  const [invoice, items, client] = await Promise.all([
    pb.collection("invoices").getOne(params.id),
    pb.collection("invoice_items").getFullList({
      filter: \`invoice_id = "\${params.id}"\`,
    }),
    pb.collection("clients").getOne(invoice.client_id),
  ]);

  // Build PDF with PDFKit
  const doc = new PDFDocument({ margin: 50, size: "A4" });
  const chunks: Buffer[] = [];
  doc.on("data", c => chunks.push(c));

  // Header, line items, totals, GST breakdown...
  renderInvoicePDF(doc, { invoice, items, client });
  doc.end();

  await new Promise(r => doc.on("end", r));
  const pdf = Buffer.concat(chunks);

  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": \`attachment; filename="\${invoice.number}.pdf"\`,
    },
  });
}`;
  return (
    <div className="h-full overflow-auto p-5 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <FileText size={16} className="text-amber-400" />
        <h2 className="font-display text-xl font-semibold text-zinc-50">PDF Generation</h2>
        <TechBadge label="PDFKit" color="border-amber-500/30 text-amber-400 bg-amber-500/8" />
      </div>
      <p className="text-xs text-zinc-500">Server-side PDF generation using PDFKit. Invoice data fetched from PocketBase, rendered to a Buffer, streamed back as a PDF response — no temp files, no cloud storage needed.</p>
      <CodeBlock code={code} />
    </div>
  );
}

function PanelRazorpay() {
  const webhookCode = `// POST /api/webhooks/razorpay
export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig  = req.headers.get("x-razorpay-signature")!;

  // Verify HMAC-SHA256 signature
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body).digest("hex");

  if (sig !== expected)
    return new Response("Invalid signature", { status: 401 });

  const event = JSON.parse(body);

  if (event.event === "payment.captured") {
    const { payment } = event.payload;
    const linkId = payment.entity.invoice_id; // Razorpay Payment Link ID

    const pb = await createPBAdminClient();
    const inv = await pb.collection("invoices")
      .getFirstListItem(\`razorpay_link_id = "\${linkId}"\`);

    await pb.collection("invoices").update(inv.id, {
      status: "paid",
      razorpay_payment_id: payment.entity.id,
    });
  }

  return Response.json({ ok: true });
}`;
  return (
    <div className="h-full overflow-auto p-5 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Webhook size={16} className="text-purple-400" />
        <h2 className="font-display text-xl font-semibold text-zinc-50">Razorpay Webhooks</h2>
        <TechBadge label="payment.captured" color="border-purple-500/30 text-purple-400 bg-purple-500/8" />
      </div>
      <p className="text-xs text-zinc-500">
        Creating a payment link calls <code className="text-zinc-300 bg-zinc-800 px-1 rounded">POST /v1/payment_links</code> with the invoice amount.
        When the customer pays, Razorpay fires a signed webhook — we verify the HMAC and mark the invoice as paid in PocketBase.
      </p>
      <CodeBlock code={webhookCode} />
    </div>
  );
}

function PanelWhatsAppAPI() {
  const code = `// POST /api/invoices/[id]/send-whatsapp
export async function POST(req, { params }) {
  const pb = await createPBAdminClient();

  const invoice = await pb.collection("invoices").getOne(params.id);
  const client  = await pb.collection("clients").getOne(invoice.client_id);

  // Ensure Razorpay link exists
  if (!invoice.razorpay_link_id) {
    const link = await createRazorpayLink(invoice);
    await pb.collection("invoices").update(invoice.id, {
      razorpay_link_id: link.id,
      status: "sent",
    });
  }

  const phone = client.phone.replace(/\\D/g, ""); // strip non-digits

  // WhatsApp Cloud API — template message
  await fetch(\`https://graph.facebook.com/v20.0/\${PHONE_ID}/messages\`, {
    method: "POST",
    headers: { Authorization: \`Bearer \${WHATSAPP_TOKEN}\`,
               "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: \`91\${phone}\`,
      type: "template",
      template: {
        name: "invoice_ready",
        language: { code: "en" },
        components: [{
          type: "body",
          parameters: [
            { type: "text", text: client.name },
            { type: "text", text: invoice.number },
            { type: "currency", currency: { code: "INR",
                amount_1000: invoice.total * 1000 }},
            { type: "text", text: invoice.razorpay_short_url },
          ],
        }],
      },
    }),
  });

  return Response.json({ ok: true });
}`;
  return (
    <div className="h-full overflow-auto p-5 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Globe size={16} className="text-green-400" />
        <h2 className="font-display text-xl font-semibold text-zinc-50">WhatsApp Integration</h2>
        <TechBadge label="Meta Cloud API" color="border-green-500/30 text-green-400 bg-green-500/8" />
      </div>
      <p className="text-xs text-zinc-500">
        Uses Meta&apos;s WhatsApp Business Cloud API with a pre-approved <code className="text-zinc-300 bg-zinc-800 px-1 rounded">invoice_ready</code> template.
        A Razorpay short payment link is embedded so the client can pay directly from the chat.
      </p>
      <CodeBlock code={code} />
    </div>
  );
}

// ─── Step definitions ─────────────────────────────────────────────────────────

const PRODUCT_STEPS = [
  { id: "dashboard",  label: "Dashboard",       icon: BarChart3,     panel: PanelDashboard,       desc: "Your command centre — see outstanding revenue, this month's collections, and recent invoices at a glance." },
  { id: "create",     label: "Create Invoice",  icon: FileText,      panel: PanelCreateInvoice,   desc: "Fill in client, add line items, toggle GST. InvoiceSnap auto-calculates the total and assigns the next invoice number." },
  { id: "whatsapp",   label: "Send on WhatsApp",icon: MessageCircle, panel: PanelWhatsApp,        desc: "One tap. Your client gets a WhatsApp message with the PDF invoice and a Razorpay payment link — no email configuration needed." },
  { id: "tracking",   label: "Track Payments",  icon: CheckCircle2,  panel: PanelPaymentTracking, desc: "Invoices move from Sent → Paid automatically when the customer pays via Razorpay. Send a nudge directly from this screen." },
  { id: "clients",    label: "Client Directory",icon: Users,         panel: PanelClients,         desc: "Save a client once. Their name, phone, GST number, and address auto-fill on every future invoice." },
  { id: "analytics",  label: "Analytics",       icon: TrendingUp,    panel: PanelAnalytics,       desc: "Monthly revenue chart, average collection time, and payment rates — so you always know where your cash is." },
];

const TECH_STEPS = [
  { id: "stack",     label: "Tech Stack",       icon: Terminal,  panel: PanelTechStack,    desc: "Next.js 16 + PocketBase + Razorpay + WhatsApp Cloud API, deployed on a GCP VM behind Nginx. No managed databases, no vendor lock-in." },
  { id: "model",     label: "Data Model",       icon: Database,  panel: PanelDataModel,    desc: "Four PocketBase collections: users, clients, invoices, invoice_items. All foreign keys are plain text fields — PocketBase relations are avoided for query flexibility." },
  { id: "api",       label: "Invoice API",      icon: Code2,     panel: PanelInvoiceAPI,   desc: "POST /api/invoices validates the body with Zod, auto-increments the invoice number, then creates the invoice record and all line items in a single parallel batch." },
  { id: "pdf",       label: "PDF Generation",   icon: FileText,  panel: PanelPDF,          desc: "PDFKit runs server-side in the API route. Invoice data is fetched from PocketBase, laid out programmatically, and streamed directly to the browser — no S3, no temp files." },
  { id: "razorpay",  label: "Razorpay",         icon: Webhook,   panel: PanelRazorpay,     desc: "Payment link is created on first WhatsApp send. Razorpay fires a signed webhook on payment.captured — we verify the HMAC and flip the invoice status to 'paid'." },
  { id: "whatsapp",  label: "WhatsApp API",     icon: Globe,     panel: PanelWhatsAppAPI,  desc: "Meta's WhatsApp Cloud API with a pre-approved template. The Razorpay short URL is injected as a template parameter so the client can pay directly from the chat." },
];

// ─── Main demo player ─────────────────────────────────────────────────────────

export default function DemoPage({ params }: { params: { type: string } }) {
  const isProduct = params.type !== "technical";
  const steps = isProduct ? PRODUCT_STEPS : TECH_STEPS;
  const accentClass = isProduct ? "text-emerald-400" : "text-blue-400";
  const accentBg    = isProduct ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                                : "bg-blue-500/10 border-blue-500/25 text-blue-400";
  const accentSolid = isProduct ? "bg-emerald-600 hover:bg-emerald-500" : "bg-blue-600 hover:bg-blue-500";

  const [step, setStep] = useState(0);
  const current = steps[step];
  const Panel = current.panel;

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col">
      {/* ── Top bar ── */}
      <header className="h-12 flex-shrink-0 flex items-center justify-between px-5 border-b border-white/7 bg-[#0c0c0e]">
        <div className="flex items-center gap-4">
          <Logo textSize="text-base" />
          <span className="text-xs text-zinc-600">|</span>
          <span className={`text-xs font-medium ${accentClass}`}>
            {isProduct ? "Product Tour" : "Technical Demo"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-600 hidden sm:block">
            {step + 1} / {steps.length}
          </span>
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`h-1.5 rounded-full transition-all ${i === step ? `w-5 ${isProduct ? "bg-emerald-500" : "bg-blue-500"}` : "w-1.5 bg-zinc-700 hover:bg-zinc-500"}`}
              />
            ))}
          </div>
          <Link href="/demo" className="ml-2 text-zinc-500 hover:text-zinc-300 transition-colors">
            <X size={15} />
          </Link>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* ── Step sidebar ── */}
        <aside className="hidden md:flex flex-col w-52 flex-shrink-0 border-r border-white/7 bg-[#0c0c0e] py-4 px-3 overflow-y-auto">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const active = i === step;
            const done   = i < step;
            return (
              <button
                key={s.id}
                onClick={() => setStep(i)}
                className={`flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-lg mb-0.5 text-xs font-medium transition-all ${
                  active
                    ? `${accentBg} border`
                    : done
                    ? "text-zinc-400 hover:bg-white/4"
                    : "text-zinc-600 hover:bg-white/3 hover:text-zinc-400"
                }`}
              >
                {done ? (
                  <Check size={13} className="shrink-0 text-emerald-400" />
                ) : (
                  <Icon size={13} className="shrink-0" />
                )}
                <span className="truncate">{s.label}</span>
              </button>
            );
          })}

          <div className="mt-auto pt-4 border-t border-white/7 space-y-2">
            <Link href="/auth?tab=signup" className={`flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-xs font-semibold text-white ${accentSolid} transition-colors`}>
              Get Started <ArrowRight size={11} />
            </Link>
            <Link href="/demo" className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-xs text-zinc-500 hover:text-zinc-300 transition-colors border border-white/7">
              ← Back to demos
            </Link>
          </div>
        </aside>

        {/* ── Main content ── */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Step header */}
          <div className="flex-shrink-0 px-5 py-4 border-b border-white/7 bg-[#0a0a0c]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-mono ${accentClass} opacity-60`}>
                    {String(step + 1).padStart(2, "0")} / {String(steps.length).padStart(2, "0")}
                  </span>
                </div>
                <h2 className="font-display text-lg font-semibold text-zinc-50">{current.label}</h2>
                <p className="text-xs text-zinc-500 mt-0.5 max-w-2xl leading-relaxed">{current.desc}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  disabled={step === 0}
                  onClick={() => setStep(s => s - 1)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg border border-white/8 text-zinc-400 hover:text-zinc-100 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  disabled={step === steps.length - 1}
                  onClick={() => setStep(s => s + 1)}
                  className={`h-8 px-3 flex items-center gap-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors ${accentSolid}`}
                >
                  Next <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* Panel */}
          <div className="flex-1 overflow-auto">
            <Panel />
          </div>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden flex-shrink-0 flex items-center justify-between px-4 py-3 border-t border-white/7 bg-[#0c0c0e]">
        <button
          disabled={step === 0}
          onClick={() => setStep(s => s - 1)}
          className="flex items-center gap-1.5 text-sm text-zinc-400 disabled:opacity-30"
        >
          <ChevronLeft size={15} /> Back
        </button>
        <span className="text-xs text-zinc-600">{current.label}</span>
        {step < steps.length - 1 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            className="flex items-center gap-1.5 text-sm font-medium text-emerald-400"
          >
            Next <ChevronRight size={15} />
          </button>
        ) : (
          <Link href="/auth?tab=signup" className="flex items-center gap-1.5 text-sm font-medium text-emerald-400">
            Start free <ArrowRight size={15} />
          </Link>
        )}
      </div>
    </div>
  );
}
