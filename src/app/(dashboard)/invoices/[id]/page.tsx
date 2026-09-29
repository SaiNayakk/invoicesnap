import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import { requireOwner } from "@/lib/owner";
import { getInvoice, isDemoUser } from "@/lib/data";
import { getInsights } from "@/lib/ai/insights";
import { daysBetween, formatDay } from "@/lib/dates";
import { formatCurrency } from "@/lib/utils";
import { Panel, RiskBadge, StatusBadge } from "@/components/app/ui";
import { InvoiceActions } from "./actions";
import { WhatsAppText } from "@/components/app/whatsapp-text";

export const metadata: Metadata = { title: "Invoice" };

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const owner = await requireOwner();
  const found = await getInvoice(owner.id, (await params).id);
  if (!found) notFound();
  const { invoice: inv, items, client, messages } = found;
  const ins = await getInsights(owner.id);
  const p = ins.predictions[inv.id];
  const stat = ins.clients[client.id];
  const late = daysBetween(inv.due_date, ins.today);

  const timeline = [
    // Imported and demo invoices were issued before their record existed.
    { at: inv.sent_at && inv.sent_at < inv.created ? inv.invoice_date : inv.created, text: `Created${inv.source === "ai" ? " from a message" : ""}` },
    ...(inv.sent_at ? [{ at: inv.sent_at, text: "Sent on WhatsApp" }] : []),
    ...messages.filter((m) => m.kind === "reminder").map((m) => ({ at: m.at || m.created, text: `Reminder sent${m.tone ? ` (${m.tone})` : ""}` })),
    ...(inv.claimed_at ? [{ at: inv.claimed_at, text: "Client said they paid" }] : []),
    ...(inv.paid_at ? [{ at: inv.paid_at, text: "Payment confirmed" }] : []),
  ].sort((a, b) => (a.at < b.at ? -1 : 1));

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2">
        <Link href="/invoices" aria-label="Back to invoices" className="-ml-2 flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-900"><ChevronLeft size={18} /></Link>
        <h1 className="font-display text-2xl font-semibold text-zinc-50">{inv.invoice_number}</h1>
        <StatusBadge status={inv.status} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-5">
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-7">
            <div className="flex flex-wrap justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-zinc-500">Billed to</p>
                <p className="mt-1 font-medium text-zinc-100">{client.name}</p>
                <p className="text-xs text-zinc-500">{[client.phone, client.city, client.gst_number && `GSTIN ${client.gst_number}`].filter(Boolean).join(" · ")}</p>
              </div>
              <div className="text-right text-xs text-zinc-400">
                <p>Issued {formatDay(inv.invoice_date, true)}</p>
                <p>Due {formatDay(inv.due_date, true)}</p>
              </div>
            </div>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[420px] text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-[11px] uppercase tracking-wide text-zinc-500">
                    <th className="pb-2 text-left font-medium">Item</th><th className="pb-2 text-right font-medium">Qty</th>
                    <th className="pb-2 text-right font-medium">Rate</th><th className="pb-2 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/70">
                  {items.map((it) => (
                    <tr key={it.id}>
                      <td className="py-2.5 text-zinc-200">{it.description}{it.hsn_sac && <span className="ml-2 text-[11px] text-zinc-600">SAC {it.hsn_sac}</span>}</td>
                      <td className="py-2.5 text-right tabular-nums text-zinc-400">{it.quantity}</td>
                      <td className="py-2.5 text-right tabular-nums text-zinc-400">{formatCurrency(it.rate)}</td>
                      <td className="py-2.5 text-right tabular-nums text-zinc-200">{formatCurrency(it.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <dl className="ml-auto mt-4 max-w-64 space-y-1.5 text-sm">
              <div className="flex justify-between"><dt className="text-zinc-500">Subtotal</dt><dd className="tabular-nums text-zinc-300">{formatCurrency(inv.subtotal)}</dd></div>
              {inv.gst_amount > 0 && (inv.supply_type === "inter" ? (
                <div className="flex justify-between"><dt className="text-zinc-500">IGST {inv.gst_rate}%</dt><dd className="tabular-nums text-zinc-300">{formatCurrency(inv.igst_amount)}</dd></div>
              ) : (
                <>
                  <div className="flex justify-between"><dt className="text-zinc-500">CGST {inv.gst_rate / 2}%</dt><dd className="tabular-nums text-zinc-300">{formatCurrency(inv.cgst_amount)}</dd></div>
                  <div className="flex justify-between"><dt className="text-zinc-500">SGST {inv.gst_rate / 2}%</dt><dd className="tabular-nums text-zinc-300">{formatCurrency(inv.sgst_amount)}</dd></div>
                </>
              ))}
              <div className="flex justify-between border-t border-zinc-800 pt-2"><dt className="font-medium text-zinc-200">Total</dt><dd className="font-display text-xl font-semibold tabular-nums text-zinc-50">{formatCurrency(inv.total)}</dd></div>
            </dl>
            {inv.notes && <p className="mt-5 border-t border-zinc-800 pt-4 text-sm text-zinc-400">{inv.notes}</p>}
          </section>

          {messages.length > 0 && (
            <Panel title="WhatsApp messages">
              <ul className="space-y-3">
                {messages.map((m) => (
                  <li key={m.id} className={m.kind === "client_reply" ? "mr-10" : "ml-10"}>
                    <p className={`whitespace-pre-line break-words rounded-lg px-3 py-2 text-sm ${m.kind === "client_reply" ? "bg-zinc-800 text-zinc-200" : "bg-emerald-950/60 text-emerald-50"}`}><WhatsAppText text={m.body} /></p>
                    <p className={`mt-1 text-[11px] text-zinc-600 ${m.kind === "client_reply" ? "" : "text-right"}`}>
                      {m.kind === "client_reply" ? client.name : m.kind === "reminder" ? "Reminder" : m.kind === "thank_you" ? "Thank-you" : "Invoice"} · {formatDay(m.at || m.created)}{m.ai_written ? " · worded by AI" : ""}
                    </p>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>

        <div className="space-y-5">
          <Panel title="Payment">
            {inv.status === "paid" ? (
              <p className="text-sm text-zinc-300">Paid {formatDay(inv.paid_at, true)}, {(() => { const d = daysBetween(inv.due_date, inv.paid_at); return d > 0 ? `${d} day${d === 1 ? "" : "s"} after` : d === 0 ? "on" : `${-d} day${d === -1 ? "" : "s"} before`; })()} the due date.</p>
            ) : p ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-zinc-300">Expected <strong className="text-zinc-50">{p.expected === ins.today ? "today" : formatDay(p.expected)}</strong></p>
                  <RiskBadge level={p.level} />
                </div>
                <p className="text-xs text-zinc-500">Most likely between {formatDay(p.earliest)} and {formatDay(p.latest)}{late > 0 ? `. It is ${late} day${late === 1 ? "" : "s"} past due.` : "."}</p>
                {p.reasons.length > 0 && (
                  <ul className="space-y-1 border-t border-zinc-800 pt-3 text-xs text-zinc-400">
                    {p.reasons.map((r) => <li key={r} className="flex gap-2"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-zinc-500" />{r}</li>)}
                  </ul>
                )}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">{inv.status === "draft" ? "Not sent yet." : "Closed."}</p>
            )}
            <div className="mt-4 border-t border-zinc-800 pt-4">
              <InvoiceActions id={inv.id} number={inv.invoice_number} status={inv.status} clientName={client.name} demo={isDemoUser(owner)} />
            </div>
          </Panel>

          {stat && stat.paid > 0 && (
            <Panel title="Payment history">
              <p className="text-sm text-zinc-300">Paid {stat.onTime} of {stat.paid} invoice{stat.paid === 1 ? "" : "s"} within a week of the due date{stat.typicalDelay !== null ? `, typically ${stat.typicalDelay > 0 ? `${stat.typicalDelay} days after it` : stat.typicalDelay === 0 ? "on the day" : `${-stat.typicalDelay} days early`}` : ""}.</p>
              <Link href="/clients" className="mt-2 inline-block text-xs text-zinc-500 hover:text-zinc-300">All clients</Link>
            </Panel>
          )}

          <Panel title="Timeline">
            <ol className="space-y-2.5">
              {timeline.map((e, i) => (
                <li key={i} className="flex gap-3 text-xs">
                  <span className="w-14 shrink-0 text-zinc-500">{formatDay(e.at)}</span>
                  <span className="text-zinc-300">{e.text}</span>
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      </div>
    </div>
  );
}
