"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Loader2, MessageCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { demoStep } from "@/components/demo/demo-events";
import { ReminderDialog } from "./reminder-dialog";
import { Empty, RiskBadge } from "./ui";

export interface AttentionItem {
  id: string;
  number: string;
  client: string;
  total: number;
  kind: "claimed" | "overdue" | "risky";
  detail: string;
  level: "low" | "medium" | "high";
  why: string;
}

/** Money that needs a decision: clients who say they've paid, late invoices, and ones predicted to be late. */
export function AttentionList({ items, demo }: { items: AttentionItem[]; demo: boolean }) {
  const router = useRouter();
  const [remind, setRemind] = useState<AttentionItem | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function confirm(id: string) {
    setBusy(id);
    const res = await fetch(`/api/invoices/${id}/confirm-payment`, { method: "POST" });
    setBusy(null);
    if (res.ok) {
      demoStep("pay");
      router.refresh();
    }
  }

  if (!items.length) return <Empty>Nothing needs you right now.</Empty>;
  return (
    <>
      <ul className="-my-2 divide-y divide-zinc-800/70">
        {items.map((it) => (
          <li key={it.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
            <Link href={`/invoices/${it.id}`} className="min-w-0 flex-1 basis-48 group">
              <p className="flex items-center gap-2 text-sm font-medium text-zinc-100 group-hover:underline">
                <span className="truncate">{it.client}</span>
                <span className="shrink-0 tabular-nums text-zinc-400">{formatCurrency(it.total)}</span>
              </p>
              <p className="mt-0.5 truncate text-xs text-zinc-500">{it.number} · {it.detail}</p>
            </Link>
            <div className="flex shrink-0 items-center gap-2">
              {it.kind === "claimed" ? (
                <button onClick={() => confirm(it.id)} disabled={busy === it.id}
                  className="flex h-8 items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-60">
                  {busy === it.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Confirm received
                </button>
              ) : (
                <>
                  {it.kind === "risky" && <RiskBadge level={it.level} title={it.why} />}
                  <button onClick={() => setRemind(it)}
                    className="flex h-8 items-center gap-1.5 rounded-lg border border-zinc-700 px-3 text-xs font-medium text-zinc-200 hover:bg-zinc-800">
                    <MessageCircle size={13} /> Remind
                  </button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
      {remind && <ReminderDialog invoiceId={remind.id} clientName={remind.client} demo={demo} onClose={() => setRemind(null)} />}
    </>
  );
}
