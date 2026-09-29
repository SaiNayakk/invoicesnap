import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Check } from "lucide-react";
import { requireOwner } from "@/lib/owner";
import { isDemoUser, listClients, listInvoices } from "@/lib/data";
import { getInsights } from "@/lib/ai/insights";
import { daysBetween, formatDay } from "@/lib/dates";
import { formatCurrency } from "@/lib/utils";
import { OPEN } from "@/lib/types";
import { PageHeader, Panel, Stat, StatusBadge } from "@/components/app/ui";
import { CashflowChart } from "@/components/app/cashflow-chart";
import { AttentionList, type AttentionItem } from "@/components/app/attention";
import { SummaryPanel } from "@/components/app/summary-panel";

export const metadata: Metadata = { title: "Overview" };

const inr = (n: number) => formatCurrency(Math.round(n));

export default async function Overview() {
  const owner = await requireOwner();
  const [invoices, clients, ins] = await Promise.all([listInvoices(owner.id), listClients(owner.id), getInsights(owner.id)]);
  const name = new Map(clients.map((c) => [c.id, c.name]));
  const t = ins.totals;

  if (!invoices.length) return <Welcome hasProfile={Boolean(owner.upi_id)} hasClients={clients.length > 0} />;

  const attention: AttentionItem[] = [];
  for (const inv of invoices) {
    const p = ins.predictions[inv.id];
    if (!OPEN.includes(inv.status) || !p) continue;
    const late = daysBetween(inv.due_date, ins.today);
    const base = { id: inv.id, number: inv.invoice_number, client: name.get(inv.client) ?? "Client", total: inv.total, level: p.level, why: p.reasons.join(". ") };
    if (inv.status === "payment_pending") attention.push({ ...base, kind: "claimed", detail: "Client says they've paid. Check your bank or UPI app." });
    else if (inv.status === "overdue") attention.push({ ...base, kind: "overdue", detail: `${late} day${late === 1 ? "" : "s"} late · expected around ${formatDay(p.expected)}` });
    else if (p.level === "high") attention.push({ ...base, kind: "risky", detail: `Due ${formatDay(inv.due_date)} · ${p.reasons[0] ?? ""}` });
  }
  const rank = (a: AttentionItem) => (a.kind === "claimed" ? 1e12 : a.kind === "overdue" ? 1e9 + a.total : a.total);
  attention.sort((a, b) => rank(b) - rank(a));

  const recent = invoices.slice(0, 6);
  const bt = ins.backtest;
  const version = `${t.outstanding}:${t.paidThisMonth}:${t.openCount}:${ins.today}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader title="Overview" sub={`${owner.business_name || "Your business"} · ${formatDay(ins.today, true)}`} />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Owed to you" value={inr(t.outstanding)} sub={`${t.openCount} open invoice${t.openCount === 1 ? "" : "s"}`} />
        <Stat label="Overdue" value={inr(t.overdue)} sub={`${t.overdueCount} invoice${t.overdueCount === 1 ? "" : "s"}`} tone={t.overdueCount ? "red" : undefined} />
        <Stat label="Expected in 30 days" value={inr(ins.forecast.next30.p50)} sub={`Likely ${inr(ins.forecast.next30.p10)} to ${inr(ins.forecast.next30.p90)}`} />
        <Stat label="Received this month" value={inr(t.paidThisMonth)} sub={`${t.paidThisMonthCount} payment${t.paidThisMonthCount === 1 ? "" : "s"}`} tone={t.paidThisMonth ? "green" : undefined} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-5">
          <Panel title="Needs your attention" sub="Payments to confirm, late invoices, and ones likely to be late"
            action={attention.length > 0 && <span className="text-xs text-zinc-500">{attention.length}</span>}>
            <AttentionList items={attention.slice(0, 8)} demo={isDemoUser(owner)} />
          </Panel>

          <Panel title="Money expected in" sub="Next six weeks, simulated from each client's payment history">
            {t.openCount ? <CashflowChart weeks={ins.forecast.weeks} /> : <p className="text-sm text-zinc-500">No open invoices, so nothing is expected yet.</p>}
          </Panel>

          <Panel title="Recent invoices" action={<Link href="/invoices" className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200">All invoices <ArrowRight size={12} /></Link>} bodyClass="p-0">
            <ul className="divide-y divide-zinc-800/70">
              {recent.map((inv) => (
                <li key={inv.id}>
                  <Link href={`/invoices/${inv.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-900/60">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-zinc-100">{name.get(inv.client)}</p>
                      <p className="text-xs text-zinc-500">{inv.invoice_number} · {formatDay(inv.invoice_date)}</p>
                    </div>
                    <span className="text-sm tabular-nums text-zinc-200">{inr(inv.total)}</span>
                    <span className="hidden w-32 justify-end sm:flex"><StatusBadge status={inv.status} /></span>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel title="This week's summary">
            <SummaryPanel version={version} />
          </Panel>
          {bt && (
            <Panel title="How good are the predictions?">
              <p className="text-sm leading-relaxed text-zinc-300">
                Replayed on {bt.invoices} of your past invoices, predicted payment dates were off by <strong className="text-zinc-50">{bt.maeModel.toFixed(1)} days</strong> on
                average, against {bt.maeDueDate.toFixed(1)} days if you assume clients pay on the due date.
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                {Math.round(bt.coverage * 100)}% of payments landed inside the predicted range.
                {bt.auc !== null && <> Late-payment warnings ranked a late invoice above an on-time one {Math.round(bt.auc * 100)}% of the time.</>}
              </p>
            </Panel>
          )}
          {t.gstThisMonth > 0 && (
            <Panel title="GST this month">
              <p className="text-sm text-zinc-300"><strong className="tabular-nums text-zinc-50">{inr(t.gstThisMonth)}</strong> charged on {formatCurrency(t.billedThisMonth)} billed.</p>
              <p className="mt-1 text-xs text-zinc-500">Reported in GSTR-1 by the 11th of next month.</p>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

function Welcome({ hasProfile, hasClients }: { hasProfile: boolean; hasClients: boolean }) {
  const steps = [
    { done: hasProfile, label: "Add your UPI ID and GSTIN", href: "/settings", note: "They go on every invoice and payment page." },
    { done: hasClients, label: "Add a client", href: "/clients", note: "Or let the invoice builder add one from a message." },
    { done: false, label: "Send your first invoice", href: "/invoices/new", note: "Type it like a WhatsApp message and review the draft." },
  ];
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <PageHeader title="Welcome to InvoiceSnap" sub="Three steps to your first payment." />
      <ol className="space-y-3">
        {steps.map((s, i) => (
          <li key={s.label}>
            <Link href={s.href} className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/40 px-5 py-4 hover:border-zinc-700">
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${s.done ? "bg-emerald-500 text-zinc-950" : "border border-zinc-700 text-zinc-400"}`}>
                {s.done ? <Check size={14} /> : i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-zinc-100">{s.label}</span>
                <span className="block text-xs text-zinc-500">{s.note}</span>
              </span>
              <ArrowRight size={15} className="text-zinc-600" />
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
