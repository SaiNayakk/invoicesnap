"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  MessageCircle,
  Download,
  Mail,
  MoreHorizontal,
  Eye,
  Copy,
  Trash2,
  ArrowUpDown,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

async function downloadPDF(invoiceId: string, invoiceNumber: string) {
  const res = await fetch(`/api/invoices/${invoiceId}/pdf`);
  if (!res.ok) { alert("Failed to generate PDF"); return; }
  const blob = await res.blob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = `${invoiceNumber}.pdf`; a.click();
  URL.revokeObjectURL(url);
}

async function sendWhatsApp(invoiceId: string) {
  const res = await fetch(`/api/invoices/${invoiceId}/send-whatsapp`, { method: "POST" });
  const data = await res.json();
  if (!res.ok) alert(data.error ?? "Failed to send");
  else alert("Sent on WhatsApp ✓");
}

async function sendEmail(invoiceId: string) {
  const res = await fetch(`/api/invoices/${invoiceId}/send-email`, { method: "POST" });
  const data = await res.json();
  if (!res.ok) alert(data.error ?? "Failed to send");
  else alert("Email sent ✓");
}

type InvoiceStatus = "paid" | "sent" | "draft" | "overdue";

type Invoice = {
  id: string;
  number: string;
  client: string;
  clientInitial: string;
  amount: number;
  status: InvoiceStatus;
  date: string;
  dueDate: string;
};

const invoices: Invoice[] = [
  { id: "1", number: "INV-2025-042", client: "Sneha Reddy", clientInitial: "S", amount: 45000, status: "paid", date: "2025-04-28", dueDate: "2025-04-30" },
  { id: "2", number: "INV-2025-041", client: "Vikram Events", clientInitial: "V", amount: 72000, status: "sent", date: "2025-04-26", dueDate: "2025-05-10" },
  { id: "3", number: "INV-2025-040", client: "Meera Tutoring", clientInitial: "M", amount: 18000, status: "overdue", date: "2025-04-15", dueDate: "2025-04-25" },
  { id: "4", number: "INV-2025-039", client: "Arjun Nair Design", clientInitial: "A", amount: 38500, status: "sent", date: "2025-04-22", dueDate: "2025-05-05" },
  { id: "5", number: "INV-2025-038", client: "Priya Photography", clientInitial: "P", amount: 62000, status: "paid", date: "2025-04-18", dueDate: "2025-04-22" },
  { id: "6", number: "INV-2025-037", client: "Deepa Krishnan", clientInitial: "D", amount: 12000, status: "overdue", date: "2025-04-10", dueDate: "2025-04-20" },
  { id: "7", number: "INV-2025-036", client: "Rohit Kumar", clientInitial: "R", amount: 55000, status: "draft", date: "2025-04-08", dueDate: "2025-04-28" },
  { id: "8", number: "INV-2025-035", client: "Sneha Reddy", clientInitial: "S", amount: 28000, status: "paid", date: "2025-04-05", dueDate: "2025-04-12" },
  { id: "9", number: "INV-2025-034", client: "Vikram Events", clientInitial: "V", amount: 95000, status: "paid", date: "2025-03-30", dueDate: "2025-04-08" },
  { id: "10", number: "INV-2025-033", client: "Arjun Nair Design", clientInitial: "A", amount: 22500, status: "draft", date: "2025-03-28", dueDate: "2025-04-15" },
];

const filterTabs = [
  { key: "all", label: "All" },
  { key: "sent", label: "Sent" },
  { key: "paid", label: "Paid" },
  { key: "overdue", label: "Overdue" },
  { key: "draft", label: "Draft" },
] as const;

const statusLabels: Record<InvoiceStatus, string> = {
  paid: "Paid",
  sent: "Sent",
  draft: "Draft",
  overdue: "Overdue",
};

export default function InvoicesPage() {
  const [activeFilter, setActiveFilter] = useState<"all" | InvoiceStatus>("all");
  const [search, setSearch] = useState("");
  const [activeMenu, setActiveMenu]   = useState<string | null>(null);
  const [loadingPDF, setLoadingPDF]   = useState<string | null>(null);
  const [loadingWA,  setLoadingWA]    = useState<string | null>(null);

  const filtered = invoices.filter((inv) => {
    const matchesFilter = activeFilter === "all" || inv.status === activeFilter;
    const matchesSearch =
      inv.client.toLowerCase().includes(search.toLowerCase()) ||
      inv.number.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalFiltered = filtered.reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="font-display text-2xl font-semibold text-zinc-50 mb-1">Invoices</h1>
          <p className="text-sm text-zinc-500">
            {filtered.length} invoice{filtered.length !== 1 ? "s" : ""} · {formatCurrency(totalFiltered)}
          </p>
        </div>
        <Button size="sm" asChild>
          <Link href="/invoices/new">
            <Plus size={15} /> New Invoice
          </Link>
        </Button>
      </div>

      {/* Filter tabs + search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex rounded-lg border border-white/8 bg-zinc-900/40 p-0.5 gap-0.5">
          {filterTabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeFilter === key
                  ? "bg-[#111113] text-zinc-100 border border-white/8 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Search by client or invoice number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8"
          />
        </div>

        <Button variant="outline" size="icon" className="h-8 w-8 shrink-0">
          <Filter size={14} />
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/8 bg-[#111113] overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3 border-b border-white/7 text-[11px] font-medium text-zinc-500 uppercase tracking-wide">
          <button className="flex items-center gap-1 hover:text-zinc-300 transition-colors text-left">
            Client <ArrowUpDown size={10} />
          </button>
          <button className="flex items-center gap-1 hover:text-zinc-300 transition-colors">
            Amount <ArrowUpDown size={10} />
          </button>
          <button className="flex items-center gap-1 hover:text-zinc-300 transition-colors">
            Status
          </button>
          <button className="flex items-center gap-1 hover:text-zinc-300 transition-colors">
            Due <ArrowUpDown size={10} />
          </button>
          <span>Actions</span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-white/5">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-zinc-600 text-sm">
              No invoices found
            </div>
          ) : (
            filtered.map((inv) => (
              <div
                key={inv.id}
                className="group grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center px-5 py-3.5 hover:bg-white/2 transition-colors"
              >
                {/* Client */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/12 border border-emerald-500/15 flex items-center justify-center text-xs font-semibold text-emerald-400 shrink-0">
                    {inv.clientInitial}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-200 truncate">{inv.client}</p>
                    <p className="text-xs text-zinc-600">{inv.number}</p>
                  </div>
                </div>

                {/* Amount */}
                <div className="text-sm font-medium text-zinc-200 tabular-nums text-right">
                  {formatCurrency(inv.amount)}
                </div>

                {/* Status */}
                <Badge variant={inv.status}>
                  {statusLabels[inv.status]}
                </Badge>

                {/* Due date */}
                <div className="text-xs text-zinc-500 text-right whitespace-nowrap">
                  {formatDate(inv.dueDate)}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 relative">
                  {inv.status !== "paid" && inv.status !== "draft" && (
                    <button
                      onClick={() => { setLoadingWA(inv.id); sendWhatsApp(inv.id).finally(() => setLoadingWA(null)); }}
                      className="h-7 w-7 rounded-md bg-[#25D366]/10 border border-[#25D366]/15 flex items-center justify-center text-[#25D366] hover:bg-[#25D366]/20 transition-colors opacity-0 group-hover:opacity-100"
                      title="Send on WhatsApp"
                    >
                      {loadingWA === inv.id ? <Loader2 size={13} className="animate-spin" /> : <MessageCircle size={13} />}
                    </button>
                  )}
                  <button
                    onClick={() => { setLoadingPDF(inv.id); downloadPDF(inv.id, inv.number).finally(() => setLoadingPDF(null)); }}
                    className="h-7 w-7 rounded-md border border-white/8 bg-zinc-900/40 flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-colors opacity-0 group-hover:opacity-100"
                    title="Download PDF"
                  >
                    {loadingPDF === inv.id ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                  </button>
                  <button
                    className="h-7 w-7 rounded-md border border-white/8 bg-zinc-900/40 flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-colors"
                    onClick={() => setActiveMenu(activeMenu === inv.id ? null : inv.id)}
                  >
                    <MoreHorizontal size={13} />
                  </button>

                  {activeMenu === inv.id && (
                    <div className="absolute right-0 top-8 z-10 rounded-lg border border-white/10 bg-zinc-900 shadow-xl p-1 min-w-36">
                      <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-zinc-300 hover:bg-white/5">
                        <Eye size={12} /> View
                      </button>
                      <button
                        onClick={() => sendEmail(inv.id)}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-zinc-300 hover:bg-white/5">
                        <Mail size={12} /> Send email
                      </button>
                      <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-zinc-300 hover:bg-white/5">
                        <Copy size={12} /> Duplicate
                      </button>
                      <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-red-400 hover:bg-red-500/8">
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
