"use client";

import { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  TrendingUp, TrendingDown, Download, Calendar,
  IndianRupee, FileText, CheckCircle2, AlertCircle, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

// ── Mock data (replace with /api/analytics fetch) ─────────────────────────────
const CURRENT_FY = "2024-25";

const fyStats = {
  total:   1248500,
  paid:    892300,
  pending: 210200,
  overdue: 146000,
  gst:     189842,
  count:   87,
};

const monthlyData = [
  { month: "Apr", total: 78000,  paid: 62000,  count: 6  },
  { month: "May", total: 92000,  paid: 80000,  count: 7  },
  { month: "Jun", total: 65000,  paid: 55000,  count: 5  },
  { month: "Jul", total: 115000, paid: 98000,  count: 9  },
  { month: "Aug", total: 88000,  paid: 75000,  count: 7  },
  { month: "Sep", total: 140000, paid: 120000, count: 11 },
  { month: "Oct", total: 98000,  paid: 82000,  count: 8  },
  { month: "Nov", total: 125000, paid: 105000, count: 10 },
  { month: "Dec", total: 110000, paid: 95000,  count: 9  },
  { month: "Jan", total: 132000, paid: 110000, count: 11 },
  { month: "Feb", total: 82000,  paid: 0,      count: 7  },
  { month: "Mar", total: 123500, paid: 0,      count: 7  },
];

// Daily data for current month (last 30 days)
const dailyData = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  amount: Math.random() < 0.3 ? 0 : Math.round((Math.random() * 45000 + 5000) / 500) * 500,
}));

const statusPie = [
  { name: "Paid",    value: 892300, color: "#10b981" },
  { name: "Sent",    value: 210200, color: "#f59e0b" },
  { name: "Overdue", value: 146000, color: "#ef4444" },
  { name: "Draft",   value: 0,      color: "#52525b" },
];

const topClients = [
  { name: "Vikram Events",     revenue: 315000 },
  { name: "Arjun Nair Design", revenue: 228500 },
  { name: "Priya Photography", revenue: 189000 },
  { name: "Sneha Reddy",       revenue: 142000 },
  { name: "Rohit Kumar",       revenue: 98000  },
  { name: "Meera Tutoring",    revenue: 54000  },
];

const monthInvoices = [
  { number: "INV-2025-042", client: "Sneha Reddy",       amount: 45000, status: "paid",    date: "28 Apr 2025" },
  { number: "INV-2025-041", client: "Vikram Events",      amount: 72000, status: "sent",    date: "26 Apr 2025" },
  { number: "INV-2025-040", client: "Meera Tutoring",     amount: 18000, status: "overdue", date: "15 Apr 2025" },
  { number: "INV-2025-039", client: "Arjun Nair Design",  amount: 38500, status: "sent",    date: "22 Apr 2025" },
  { number: "INV-2025-038", client: "Priya Photography",  amount: 62000, status: "paid",    date: "18 Apr 2025" },
  { number: "INV-2025-037", client: "Deepa Krishnan",     amount: 12000, status: "overdue", date: "10 Apr 2025" },
];

// ── Sub-components ────────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, icon: Icon, trend, color,
}: {
  label: string; value: string; sub: string;
  icon: React.ElementType; trend?: number; color: string;
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-[#111113] p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={16} className="text-current" />
        </div>
        {trend !== undefined && (
          <span className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-xl font-semibold text-zinc-100 mb-0.5">{value}</p>
      <p className="text-xs font-medium text-zinc-400">{label}</p>
      <p className="text-[10px] text-zinc-600 mt-0.5">{sub}</p>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const customTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-zinc-900 shadow-xl px-3 py-2.5">
      <p className="text-xs text-zinc-400 mb-1">{label}</p>
      {payload.map((p: { name: string; value: number }, i: number) => (
        <p key={i} className="text-sm font-semibold text-zinc-100">
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [view, setView] = useState<"monthly" | "daily">("monthly");
  const [fySelector, setFySelector] = useState(CURRENT_FY);

  const monthTotal   = monthlyData[10].total; // Feb (index 10) = current month mock
  const monthPaid    = monthlyData[9].paid;
  const todayAmount  = dailyData[dailyData.length - 1].amount;

  const badgeColor: Record<string, string> = {
    paid:    "bg-emerald-500/12 text-emerald-400 border-emerald-500/20",
    sent:    "bg-amber-500/12 text-amber-400 border-amber-500/20",
    overdue: "bg-red-500/12 text-red-400 border-red-500/20",
    draft:   "bg-zinc-500/12 text-zinc-400 border-zinc-500/20",
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl space-y-7">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-zinc-50 mb-1">Analytics</h1>
          <p className="text-sm text-zinc-500">Revenue, collections, and invoice trends</p>
        </div>
        <div className="flex items-center gap-2">
          {/* FY picker */}
          <div className="flex items-center gap-1.5 rounded-lg border border-white/8 bg-zinc-900/50 px-3 py-1.5">
            <Calendar size={13} className="text-zinc-500" />
            <select
              value={fySelector}
              onChange={e => setFySelector(e.target.value)}
              className="bg-transparent text-sm text-zinc-300 outline-none cursor-pointer"
            >
              <option value="2024-25">FY 2024-25</option>
              <option value="2023-24">FY 2023-24</option>
              <option value="2022-23">FY 2022-23</option>
            </select>
          </div>
          <Button variant="outline" size="sm">
            <Download size={14} /> Export Statement
          </Button>
        </div>
      </div>

      {/* ── Period cards ── */}
      <div>
        <p className="text-[11px] font-medium text-zinc-600 uppercase tracking-widest mb-3">Today</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <StatCard label="Invoiced today"   value={formatCurrency(todayAmount)}  sub="1 invoice created"  icon={FileText}     trend={12}  color="bg-blue-500/12 text-blue-400"    />
          <StatCard label="Collected today"  value={formatCurrency(0)}            sub="Awaiting payments"  icon={IndianRupee}  trend={0}   color="bg-emerald-500/12 text-emerald-400" />
          <StatCard label="Pending today"    value={formatCurrency(todayAmount)}  sub="1 unpaid invoice"   icon={Clock}        color="bg-amber-500/12 text-amber-400"   />
          <StatCard label="Overdue alerts"   value="0"                            sub="No action needed"   icon={AlertCircle}  trend={-100} color="bg-zinc-700/50 text-zinc-400"   />
        </div>

        <p className="text-[11px] font-medium text-zinc-600 uppercase tracking-widest mb-3">This Month (April 2025)</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <StatCard label="Total invoiced"   value={formatCurrency(monthTotal)}  sub={`${monthInvoices.length} invoices`} icon={FileText}      trend={18}  color="bg-blue-500/12 text-blue-400"       />
          <StatCard label="Collected"        value={formatCurrency(monthPaid)}   sub="4 invoices paid"                    icon={CheckCircle2}  trend={22}  color="bg-emerald-500/12 text-emerald-400"  />
          <StatCard label="Outstanding"      value={formatCurrency(90000)}       sub="2 invoices pending"                 icon={Clock}                    color="bg-amber-500/12 text-amber-400"      />
          <StatCard label="GST collected"    value={formatCurrency(18960)}       sub="GST liability"                      icon={IndianRupee}              color="bg-purple-500/12 text-purple-400"    />
        </div>

        <p className="text-[11px] font-medium text-zinc-600 uppercase tracking-widest mb-3">Financial Year {fySelector} (Apr – Mar)</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Total invoiced"   value={formatCurrency(fyStats.total)}   sub={`${fyStats.count} invoices`} icon={FileText}      trend={34}  color="bg-blue-500/12 text-blue-400"       />
          <StatCard label="Revenue collected" value={formatCurrency(fyStats.paid)}   sub="72% collection rate"         icon={CheckCircle2}  trend={28}  color="bg-emerald-500/12 text-emerald-400"  />
          <StatCard label="Outstanding"      value={formatCurrency(fyStats.pending)} sub="Awaiting payment"            icon={Clock}                    color="bg-amber-500/12 text-amber-400"      />
          <StatCard label="Total GST"        value={formatCurrency(fyStats.gst)}     sub="GST liability (FY)"          icon={IndianRupee}              color="bg-purple-500/12 text-purple-400"    />
        </div>
      </div>

      {/* ── Revenue trend chart ── */}
      <div className="rounded-xl border border-white/8 bg-[#111113] p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-semibold text-zinc-200">Revenue Trend</h2>
            <p className="text-xs text-zinc-500">Invoiced vs collected — FY {fySelector}</p>
          </div>
          <div className="flex rounded-lg border border-white/8 bg-zinc-900/40 p-0.5">
            <button
              onClick={() => setView("monthly")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${view === "monthly" ? "bg-[#0c0c0e] text-zinc-100 border border-white/8" : "text-zinc-500 hover:text-zinc-300"}`}
            >Monthly</button>
            <button
              onClick={() => setView("daily")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${view === "daily" ? "bg-[#0c0c0e] text-zinc-100 border border-white/8" : "text-zinc-500 hover:text-zinc-300"}`}
            >Daily</button>
          </div>
        </div>

        {view === "monthly" ? (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthlyData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}    />
                </linearGradient>
                <linearGradient id="gradPaid" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `₹${v/1000}K`} tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={customTooltip} />
              <Legend wrapperStyle={{ fontSize: 12, color: "#71717a" }} />
              <Area type="monotone" dataKey="total" name="Invoiced" stroke="#10b981" strokeWidth={2} fill="url(#gradTotal)" />
              <Area type="monotone" dataKey="paid"  name="Collected" stroke="#3b82f6" strokeWidth={2} fill="url(#gradPaid)"  />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dailyData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `₹${v/1000}K`} tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={customTooltip} />
              <Bar dataKey="amount" name="Invoiced" fill="#10b981" radius={[3, 3, 0, 0]} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Bottom row: pie + bar + table ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Status donut */}
        <div className="rounded-xl border border-white/8 bg-[#111113] p-5">
          <h2 className="text-sm font-semibold text-zinc-200 mb-1">Status Breakdown</h2>
          <p className="text-xs text-zinc-500 mb-4">FY {fySelector}</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={statusPie} cx="50%" cy="50%" innerRadius={52} outerRadius={72}
                   dataKey="value" paddingAngle={3}>
                {statusPie.map((entry, i) => (
                  <Cell key={i} fill={entry.color} opacity={entry.value === 0 ? 0.2 : 1} />
                ))}
              </Pie>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {statusPie.map(s => (
              <div key={s.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-xs text-zinc-400">{s.name}</span>
                </div>
                <span className="text-xs font-medium text-zinc-300">{formatCurrency(s.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top clients bar */}
        <div className="rounded-xl border border-white/8 bg-[#111113] p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-zinc-200 mb-1">Top Clients by Revenue</h2>
          <p className="text-xs text-zinc-500 mb-4">Paid invoices · FY {fySelector}</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topClients} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tickFormatter={v => `₹${v/1000}K`} tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#a1a1aa", fontSize: 11 }} axisLine={false} tickLine={false} width={110} />
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
              <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[0, 4, 4, 0]} opacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Monthly invoice statement ── */}
      <div className="rounded-xl border border-white/8 bg-[#111113]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/7">
          <div>
            <h2 className="text-sm font-semibold text-zinc-200">April 2025 — Invoice Statement</h2>
            <p className="text-xs text-zinc-500">{monthInvoices.length} invoices · {formatCurrency(monthTotal)} total</p>
          </div>
          <Button variant="outline" size="sm">
            <Download size={13} /> Download PDF
          </Button>
        </div>

        {/* Statement header row */}
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-5 py-2.5 border-b border-white/5 text-[11px] font-medium text-zinc-600 uppercase tracking-wide">
          <span>#</span><span>Client</span><span>Date</span><span>Status</span><span>Amount</span>
        </div>

        {monthInvoices.map((inv, i) => (
          <div key={inv.number} className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-5 py-3 items-center border-b border-white/5 hover:bg-white/2 transition-colors last:border-0">
            <span className="text-xs text-zinc-600 w-6">{i + 1}</span>
            <div>
              <p className="text-sm font-medium text-zinc-200">{inv.client}</p>
              <p className="text-xs text-zinc-600">{inv.number}</p>
            </div>
            <span className="text-xs text-zinc-500">{inv.date}</span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border ${badgeColor[inv.status]}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80 inline-block" />
              {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
            </span>
            <span className="text-sm font-semibold text-zinc-200 tabular-nums">{formatCurrency(inv.amount)}</span>
          </div>
        ))}

        {/* Statement totals */}
        <div className="px-5 py-4 border-t border-white/7 flex justify-end gap-8">
          <div className="text-right">
            <p className="text-xs text-zinc-500 mb-0.5">Total Invoiced</p>
            <p className="text-base font-semibold text-zinc-100">{formatCurrency(monthTotal)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-500 mb-0.5">Collected</p>
            <p className="text-base font-semibold text-emerald-400">{formatCurrency(monthPaid)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-500 mb-0.5">Outstanding</p>
            <p className="text-base font-semibold text-amber-400">{formatCurrency(monthTotal - monthPaid)}</p>
          </div>
        </div>
      </div>

      {/* ── GST Summary (FY) ── */}
      <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/4 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-emerald-300">GST Summary — FY {fySelector}</h2>
            <p className="text-xs text-zinc-500">For your CA / tax filing</p>
          </div>
          <Button variant="outline" size="sm" className="border-emerald-500/25 text-emerald-400 hover:border-emerald-500/40">
            <Download size={13} /> GSTR-1 Export
          </Button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Taxable Turnover",  value: formatCurrency(fyStats.total - fyStats.gst) },
            { label: "Total GST Collected", value: formatCurrency(fyStats.gst) },
            { label: "CGST (est.)",       value: formatCurrency(fyStats.gst / 2) },
            { label: "SGST (est.)",       value: formatCurrency(fyStats.gst / 2) },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg border border-emerald-500/15 bg-emerald-500/5 p-4">
              <p className="text-xs text-emerald-600 mb-1">{label}</p>
              <p className="text-base font-semibold text-emerald-300">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
