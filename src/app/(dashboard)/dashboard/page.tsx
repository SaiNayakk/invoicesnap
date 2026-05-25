import Link from "next/link";
import {
  TrendingUp,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  ArrowRight,
  MessageCircle,
  IndianRupee,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

const stats = [
  {
    label: "Total Outstanding",
    value: formatCurrency(148500),
    sub: "across 12 invoices",
    icon: IndianRupee,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/15",
  },
  {
    label: "Paid This Month",
    value: formatCurrency(82300),
    sub: "8 invoices paid",
    icon: CheckCircle2,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/15",
  },
  {
    label: "Invoices Sent",
    value: "23",
    sub: "this month",
    icon: FileText,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/15",
  },
  {
    label: "Overdue",
    value: "4",
    sub: formatCurrency(38200) + " at risk",
    icon: AlertCircle,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/15",
  },
];

const recentInvoices = [
  {
    id: "INV-2025-042",
    client: "Sneha Reddy",
    clientInitial: "S",
    amount: 45000,
    status: "paid" as const,
    date: "2025-04-28",
    dueDate: "2025-04-30",
  },
  {
    id: "INV-2025-041",
    client: "Vikram Events",
    clientInitial: "V",
    amount: 72000,
    status: "sent" as const,
    date: "2025-04-26",
    dueDate: "2025-05-10",
  },
  {
    id: "INV-2025-040",
    client: "Meera Tutoring",
    clientInitial: "M",
    amount: 18000,
    status: "overdue" as const,
    date: "2025-04-15",
    dueDate: "2025-04-25",
  },
  {
    id: "INV-2025-039",
    client: "Arjun Nair Design",
    clientInitial: "A",
    amount: 38500,
    status: "sent" as const,
    date: "2025-04-22",
    dueDate: "2025-05-05",
  },
  {
    id: "INV-2025-038",
    client: "Priya Photography",
    clientInitial: "P",
    amount: 62000,
    status: "paid" as const,
    date: "2025-04-18",
    dueDate: "2025-04-22",
  },
];

const statusLabels: Record<string, string> = {
  paid:            "Paid",
  sent:            "Sent",
  draft:           "Draft",
  overdue:         "Overdue",
  payment_pending: "Awaiting Confirmation",
};

export default function DashboardPage() {
  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-semibold text-zinc-50 mb-1">
            Good morning, Rahul 👋
          </h1>
          <p className="text-sm text-zinc-500">Here&apos;s what&apos;s happening with your invoices today.</p>
        </div>
        <Button size="sm" asChild>
          <Link href="/invoices/new">
            <Plus size={15} /> New Invoice
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, sub, icon: Icon, color, bg, border }) => (
          <div
            key={label}
            className="rounded-xl border border-white/8 bg-[#111113] p-5 card-hover"
          >
            <div className={`w-9 h-9 rounded-lg ${bg} border ${border} flex items-center justify-center mb-3`}>
              <Icon size={17} className={color} />
            </div>
            <p className="text-xl font-semibold text-zinc-100 mb-0.5">{value}</p>
            <p className="text-xs text-zinc-500">{label}</p>
            <p className="text-[10px] text-zinc-600 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Recent Invoices + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent invoices table */}
        <div className="lg:col-span-2 rounded-xl border border-white/8 bg-[#111113]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/7">
            <div>
              <h2 className="text-sm font-semibold text-zinc-200">Recent Invoices</h2>
              <p className="text-xs text-zinc-500">Your last 5 invoices</p>
            </div>
            <Button variant="ghost" size="sm" className="text-xs" asChild>
              <Link href="/invoices">
                View all <ArrowRight size={12} />
              </Link>
            </Button>
          </div>

          <div className="divide-y divide-white/5">
            {recentInvoices.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/2 transition-colors group"
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-emerald-500/12 border border-emerald-500/15 flex items-center justify-center text-xs font-semibold text-emerald-400 shrink-0">
                  {inv.clientInitial}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-zinc-200 truncate">{inv.client}</p>
                  </div>
                  <p className="text-xs text-zinc-600">{inv.id} · Due {formatDate(inv.dueDate)}</p>
                </div>

                {/* Amount */}
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium text-zinc-200">{formatCurrency(inv.amount)}</p>
                  <Badge variant={inv.status} className="mt-0.5">
                    {statusLabels[inv.status]}
                  </Badge>
                </div>

                {/* Actions (shown on hover) */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  {inv.status !== "paid" && (
                    <button className="h-7 w-7 rounded-md bg-[#25D366]/15 border border-[#25D366]/20 flex items-center justify-center text-[#25D366] hover:bg-[#25D366]/25 transition-colors">
                      <MessageCircle size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Quick actions */}
          <div className="rounded-xl border border-white/8 bg-[#111113] p-5">
            <h2 className="text-sm font-semibold text-zinc-200 mb-4">Quick actions</h2>
            <div className="flex flex-col gap-2">
              <Button className="w-full justify-start gap-3" size="sm" asChild>
                <Link href="/invoices/new">
                  <Plus size={15} /> Create new invoice
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3" size="sm" asChild>
                <Link href="/clients">
                  <Plus size={15} /> Add client
                </Link>
              </Button>
            </div>
          </div>

          {/* Summary ring */}
          <div className="rounded-xl border border-white/8 bg-[#111113] p-5">
            <h2 className="text-sm font-semibold text-zinc-200 mb-4">This month</h2>
            <div className="space-y-3">
              {[
                { label: "Paid", count: 8, amount: 82300, color: "bg-emerald-500" },
                { label: "Sent", count: 7, amount: 110500, color: "bg-amber-500" },
                { label: "Overdue", count: 4, amount: 38200, color: "bg-red-500" },
                { label: "Draft", count: 4, amount: 54000, color: "bg-zinc-600" },
              ].map(({ label, count, amount, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${color} shrink-0`} />
                  <span className="text-xs text-zinc-400 flex-1">{label}</span>
                  <span className="text-xs text-zinc-500">{count}</span>
                  <span className="text-xs font-medium text-zinc-300">{formatCurrency(amount)}</span>
                </div>
              ))}
            </div>

            {/* Bar chart visual */}
            <div className="mt-5 pt-4 border-t border-white/7">
              <div className="flex items-end gap-1 h-16">
                {[65, 40, 75, 55, 90, 70, 85, 60, 45, 80, 95, 72].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm bg-emerald-500/20 hover:bg-emerald-500/40 transition-colors cursor-pointer"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-1 text-[10px] text-zinc-600">
                <span>Jan</span>
                <span>Apr</span>
              </div>
            </div>
          </div>

          {/* Upgrade nudge (if free plan) */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={15} className="text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-300">Upgrade to Pro</span>
            </div>
            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
              Send invoices via WhatsApp and accept payments via UPI. Used 4 of 5 free invoices.
            </p>
            <div className="w-full bg-zinc-800 rounded-full h-1.5 mb-4">
              <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: "80%" }} />
            </div>
            <Button className="w-full text-xs" size="sm" asChild>
              <Link href="#">Upgrade — ₹299/mo</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
