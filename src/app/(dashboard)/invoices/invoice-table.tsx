"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { daysBetween, formatDay } from "@/lib/dates";
import type { InvoiceStatus } from "@/lib/types";
import { Empty, RiskBadge, StatusBadge } from "@/components/app/ui";
import { cn } from "@/lib/utils";

export interface Row {
  id: string; number: string; client: string; total: number; status: InvoiceStatus;
  date: string; due: string; paidAt: string; expected: string | null; level: "low" | "medium" | "high" | null; why: string;
}

const FILTERS: { id: "all" | "open" | "overdue" | "payment_pending" | "paid" | "draft"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "open", label: "Unpaid" },
  { id: "overdue", label: "Overdue" },
  { id: "payment_pending", label: "To confirm" },
  { id: "paid", label: "Paid" },
  { id: "draft", label: "Drafts" },
];

function whenPaid(r: Row, today: string): React.ReactNode {
  if (r.status === "paid" && r.paidAt) {
    const late = daysBetween(r.due, r.paidAt);
    return <span className="text-zinc-500">Paid {formatDay(r.paidAt)}{late > 7 ? <span className="text-zinc-600"> · {late}d late</span> : null}</span>;
  }
  if (r.expected && r.level) {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="text-zinc-300">{r.expected === today ? "Today" : formatDay(r.expected)}</span>
        {r.level !== "low" && <RiskBadge level={r.level} title={r.why} />}
      </span>
    );
  }
  return <span className="text-zinc-600">-</span>;
}

export function InvoiceTable({ rows, today }: { rows: Row[]; today: string }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [q, setQ] = useState("");
  const shown = useMemo(() => rows.filter((r) => {
    const f = filter === "all" || r.status === filter || (filter === "open" && ["sent", "overdue", "payment_pending"].includes(r.status));
    const s = !q || r.client.toLowerCase().includes(q.toLowerCase()) || r.number.toLowerCase().includes(q.toLowerCase());
    return f && s;
  }), [rows, filter, q]);
  const counts = (id: string) => rows.filter((r) => id === "all" || r.status === id || (id === "open" && ["sent", "overdue", "payment_pending"].includes(r.status))).length;
  const total = shown.reduce((s, r) => s + r.total, 0);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="-mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {FILTERS.map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={cn("shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                filter === f.id ? "bg-zinc-100 text-zinc-900" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200")}>
              {f.label} <span className={filter === f.id ? "text-zinc-500" : "text-zinc-600"}>{counts(f.id)}</span>
            </button>
          ))}
        </div>
        <label className="relative sm:ml-auto sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search client or number" aria-label="Search invoices"
            className="h-9 w-full rounded-lg border border-zinc-800 bg-zinc-900/60 pl-8 pr-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-600 focus:outline-none" />
        </label>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40">
        <div className="hidden grid-cols-[minmax(0,1fr)_110px_150px_90px_170px] gap-4 border-b border-zinc-800 px-5 py-2.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500 md:grid">
          <span>Client</span><span className="text-right">Amount</span><span>Status</span><span>Due</span><span>Payment</span>
        </div>
        {shown.length === 0 ? <Empty>No invoices here.</Empty> : (
          <ul className="divide-y divide-zinc-800/70">
            {shown.map((r) => (
              <li key={r.id}>
                <Link href={`/invoices/${r.id}`}
                  className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 px-4 py-3 hover:bg-zinc-900/60 sm:px-5 md:grid-cols-[minmax(0,1fr)_110px_150px_90px_170px] md:items-center">
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-zinc-100">{r.client}</span>
                    <span className="block text-xs text-zinc-500">{r.number} · {formatDay(r.date)}</span>
                  </span>
                  <span className="text-right text-sm tabular-nums text-zinc-100">{formatCurrency(r.total)}</span>
                  {/* Phones: status and payment share one line. From md they're separate columns. */}
                  <span className="col-span-2 flex flex-wrap items-center gap-x-3 gap-y-1 md:contents">
                    <span><StatusBadge status={r.status} /></span>
                    <span className="hidden text-xs text-zinc-400 md:block">{formatDay(r.due)}</span>
                    <span className="text-xs">{whenPaid(r, today)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {shown.length > 0 && (
          <div className="flex justify-between border-t border-zinc-800 px-5 py-2.5 text-xs text-zinc-500">
            <span>{shown.length} shown</span><span className="tabular-nums">{formatCurrency(total)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
