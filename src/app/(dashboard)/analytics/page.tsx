import type { Metadata } from "next";
import { requireOwner } from "@/lib/owner";
import { listClients, listInvoices } from "@/lib/data";
import { dateOf, daysBetween, financialYear, todayIST } from "@/lib/dates";
import { formatCurrency } from "@/lib/utils";
import { PageHeader, Panel, Stat } from "@/components/app/ui";

export const metadata: Metadata = { title: "Reports" };

const inr = (n: number) => formatCurrency(Math.round(n));
const MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

export default async function ReportsPage() {
  const owner = await requireOwner();
  const [all, clients] = await Promise.all([listInvoices(owner.id), listClients(owner.id)]);
  const today = todayIST();
  const fy = financialYear(today);
  const invoices = all.filter((i) => i.status !== "draft" && i.status !== "cancelled" && i.invoice_date >= fy.start && i.invoice_date <= fy.end);
  const name = new Map(clients.map((c) => [c.id, c.name]));

  const billed = invoices.reduce((s, i) => s + i.total, 0);
  const paid = all.filter((i) => i.paid_at && dateOf(i.paid_at) >= fy.start && dateOf(i.paid_at) <= fy.end);
  const received = paid.reduce((s, i) => s + i.total, 0);
  const gst = invoices.reduce((s, i) => s + (i.gst_amount || 0), 0);
  const delays = paid.map((i) => daysBetween(i.invoice_date, i.paid_at)).sort((a, b) => a - b);
  const medianDays = delays.length ? delays[Math.floor(delays.length / 2)] : null;

  const months = MONTHS.map((m, k) => {
    const y = k < 9 ? Number(fy.start.slice(0, 4)) : Number(fy.start.slice(0, 4)) + 1;
    const key = `${y}-${String(((k + 3) % 12) + 1).padStart(2, "0")}`;
    const inv = invoices.filter((i) => i.invoice_date.startsWith(key));
    return {
      label: m, key, future: key > today.slice(0, 7),
      billed: inv.reduce((s, i) => s + i.total, 0),
      received: paid.filter((i) => dateOf(i.paid_at).startsWith(key)).reduce((s, i) => s + i.total, 0),
      taxable: inv.reduce((s, i) => s + i.subtotal, 0),
      cgst: inv.reduce((s, i) => s + (i.cgst_amount || 0), 0),
      sgst: inv.reduce((s, i) => s + (i.sgst_amount || 0), 0),
      igst: inv.reduce((s, i) => s + (i.igst_amount || 0), 0),
      count: inv.length,
    };
  });
  const max = Math.max(1, ...months.map((m) => Math.max(m.billed, m.received)));

  const byClient = new Map<string, number>();
  for (const i of invoices) byClient.set(i.client, (byClient.get(i.client) ?? 0) + i.total);
  const top = [...byClient].sort((a, b) => b[1] - a[1]).slice(0, 6);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader title="Reports" sub={`Financial year ${fy.label}, April to March`} />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Billed" value={inr(billed)} sub={`${invoices.length} invoices`} />
        <Stat label="Received" value={inr(received)} sub={`${paid.length} payments`} />
        <Stat label="GST charged" value={inr(gst)} />
        <Stat label="Typical time to get paid" value={medianDays === null ? "-" : `${medianDays} days`} sub="From invoice date, median" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-5">
          <Panel title="Billed and received by month">
            <div className="flex h-44 items-end gap-1.5 sm:gap-3" role="img" aria-label="Monthly billed and received amounts">
              {months.map((m) => (
                <div key={m.key} className="flex h-full flex-1 flex-col justify-end" title={`${m.label}: billed ${inr(m.billed)}, received ${inr(m.received)}`}>
                  <div className="flex flex-1 items-end justify-center gap-0.5">
                    <div className="w-1/2 max-w-3 rounded-t-sm bg-zinc-600" style={{ height: `${(m.billed / max) * 100}%` }} />
                    <div className="w-1/2 max-w-3 rounded-t-sm bg-emerald-500" style={{ height: `${(m.received / max) * 100}%` }} />
                  </div>
                  <span className={`mt-1.5 text-center text-[10px] ${m.future ? "text-zinc-700" : "text-zinc-500"}`}>{m.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-4 text-[11px] text-zinc-500">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-zinc-600" />Billed</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-emerald-500" />Received</span>
            </div>
          </Panel>

          <Panel title="GST by month" sub="Taxable value and tax on invoices issued, for GSTR-1 and GSTR-3B" bodyClass="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-[11px] uppercase tracking-wide text-zinc-500">
                    <th className="px-5 py-2.5 text-left font-medium">Month</th><th className="px-3 py-2.5 text-right font-medium">Taxable</th>
                    <th className="px-3 py-2.5 text-right font-medium">CGST</th><th className="px-3 py-2.5 text-right font-medium">SGST</th><th className="px-5 py-2.5 text-right font-medium">IGST</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/70 tabular-nums">
                  {months.filter((m) => m.count).map((m) => (
                    <tr key={m.key}>
                      <td className="px-5 py-2 text-zinc-300">{m.label} {m.key.slice(0, 4)}</td>
                      <td className="px-3 py-2 text-right text-zinc-300">{inr(m.taxable)}</td>
                      <td className="px-3 py-2 text-right text-zinc-400">{inr(m.cgst)}</td>
                      <td className="px-3 py-2 text-right text-zinc-400">{inr(m.sgst)}</td>
                      <td className="px-5 py-2 text-right text-zinc-400">{inr(m.igst)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <Panel title="Top clients this year">
          <ul className="space-y-3">
            {top.map(([id, total]) => (
              <li key={id}>
                <div className="flex justify-between gap-2 text-sm"><span className="truncate text-zinc-200">{name.get(id)}</span><span className="tabular-nums text-zinc-400">{inr(total)}</span></div>
                <div className="mt-1 h-1 rounded-full bg-zinc-800"><div className="h-1 rounded-full bg-emerald-500/70" style={{ width: `${(total / top[0][1]) * 100}%` }} /></div>
              </li>
            ))}
            {!top.length && <li className="text-sm text-zinc-500">No invoices this year yet.</li>}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
