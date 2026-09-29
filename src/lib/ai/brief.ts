/**
 * The money summary. Every figure is computed here and sent as a numbered
 * fact; the model picks what matters and writes 3 to 5 short bullets citing the
 * facts it used. The AI service drops any bullet with a number that isn't in
 * its cited facts. Stored per user until the underlying numbers change, so a
 * page refresh never spends a model call.
 */

import { createHash } from "crypto";
import { createPBAdminClient } from "@/lib/pb/server";
import { daysBetween, formatDay } from "@/lib/dates";
import { formatCurrency } from "@/lib/utils";
import { OPEN, type Client, type Invoice } from "@/lib/types";
import { ai } from "./client";
import type { Insights } from "./insights";

export interface Fact { id: number; text: string }
export interface Brief { bullets: { text: string; facts: number[] }[]; facts: Fact[]; generated: boolean }

const inr = (n: number) => formatCurrency(Math.round(n / 100) * 100);

export function briefFacts(ins: Insights, invoices: Invoice[], clients: Client[]): Fact[] {
  const name = new Map(clients.map((c) => [c.id, c.name]));
  const t = ins.totals;
  const facts: string[] = [];
  facts.push(`Money owed to you right now: ${inr(t.outstanding)} across ${t.openCount} invoice${t.openCount === 1 ? "" : "s"}.`);
  const overdue = invoices.filter((i) => i.status === "overdue").sort((a, b) => (a.due_date < b.due_date ? -1 : 1));
  if (overdue.length) {
    const o = overdue[0];
    facts.push(`Overdue: ${inr(t.overdue)} across ${overdue.length} invoice${overdue.length === 1 ? "" : "s"}. The oldest is ${o.invoice_number} to ${name.get(o.client)}, ${daysBetween(o.due_date, ins.today)} days past due.`);
  }
  const w = ins.forecast.weeks[0];
  if (w) facts.push(`Expected in the next 7 days: about ${inr(w.p50)}, likely between ${inr(w.p10)} and ${inr(w.p90)}.`);
  const m = ins.forecast.next30;
  facts.push(`Expected in the next 30 days: about ${inr(m.p50)}, likely between ${inr(m.p10)} and ${inr(m.p90)}.`);
  facts.push(`Received so far this month: ${inr(t.paidThisMonth)} from ${t.paidThisMonthCount} invoice${t.paidThisMonthCount === 1 ? "" : "s"}.`);
  const risky = invoices
    .filter((i) => OPEN.includes(i.status) && ins.predictions[i.id]?.level === "high" && i.status !== "overdue")
    .sort((a, b) => b.total - a.total)
    .slice(0, 2);
  for (const i of risky) {
    const p = ins.predictions[i.id];
    facts.push(`${name.get(i.client)} will probably pay ${i.invoice_number} (${inr(i.total)}) late. Due ${formatDay(i.due_date)}, expected around ${formatDay(p.expected)}. Reason: ${p.reasons[0]?.toLowerCase() ?? "their history"}.`);
  }
  const reliable = Object.entries(ins.clients)
    .filter(([, s]) => s.paid >= 4 && s.onTime === s.paid)
    .sort((a, b) => b[1].billed - a[1].billed)[0];
  if (reliable) facts.push(`${name.get(reliable[0])} has paid all ${reliable[1].paid} invoices on time.`);
  if (t.awaitingConfirmation) facts.push(`${t.awaitingConfirmation} client${t.awaitingConfirmation === 1 ? " says they have" : "s say they have"} paid and ${t.awaitingConfirmation === 1 ? "is" : "are"} waiting for you to confirm.`);
  if (t.gstThisMonth > 0) facts.push(`GST charged on this month's invoices: ${inr(t.gstThisMonth)}. It is reported in GSTR-1 by the 11th of next month.`);
  return facts.map((text, i) => ({ id: i + 1, text }));
}

export async function getBrief(opts: { userId: string; tenant: string; ins: Insights; invoices: Invoice[]; clients: Client[]; generate: boolean }): Promise<Brief> {
  const facts = briefFacts(opts.ins, opts.invoices, opts.clients);
  const key = `${opts.ins.today}:${createHash("sha1").update(JSON.stringify(facts)).digest("hex").slice(0, 12)}`;
  const pb = await createPBAdminClient();
  try {
    const row = await pb.collection("invoice_briefs").getFirstListItem(pb.filter("user = {:u} && key = {:k}", { u: opts.userId, k: key }));
    return { bullets: (row.content as { bullets: Brief["bullets"] }).bullets, facts, generated: true };
  } catch {
    /* not cached yet */
  }
  if (!opts.generate) return { bullets: [], facts, generated: false };
  const r = await ai.brief(opts.tenant, facts);
  if (r.bullets.length) {
    await pb.collection("invoice_briefs").create({ user: opts.userId, key, content: { bullets: r.bullets } }).catch(() => {});
  }
  return { bullets: r.bullets, facts, generated: true };
}
