/**
 * "Fast-forward a week" for a demo sandbox.
 *
 * 1. Record what the models predict right now (money due this week, who is
 *    likely to pay late).
 * 2. Move every date in the sandbox a week into the past, so "today" is a week
 *    later.
 * 3. Play that week out: each open invoice is paid, or not, by drawing from the
 *    client's hidden habits (conditioned on it being unpaid so far); retainer
 *    clients get their next invoice.
 * 4. Compare the prediction with what happened.
 */

import type PocketBase from "pocketbase";
import { createPBAdminClient } from "@/lib/pb/server";
import { addDays, daysBetween, todayIST } from "@/lib/dates";
import { computeTotals, supplyType } from "@/lib/gst";
import { formatCurrency } from "@/lib/utils";
import { greetName } from "@/lib/messages";
import { getInsights, invalidateInsights } from "@/lib/ai/insights";
import type { Client, Invoice, Profile } from "@/lib/types";
import { atIST, getSession, type SimState } from "./sandbox";
import { DEMO_CLIENTS, drawPaymentDay, rng } from "./simulate";

const DAYS = 7;
const MAX_FORWARDS = 6;
const shift = (iso: string) => (iso ? new Date(Date.parse(iso) - DAYS * 86_400_000).toISOString() : iso);
const shiftDay = (d: string) => (d ? addDays(d, -DAYS) : d);

export interface ForwardEvent { kind: "paid" | "new" | "late"; text: string; flagged?: boolean }
export interface ForwardResult {
  predicted: { p10: number; p50: number; p90: number };
  received: number;
  events: ForwardEvent[];
  flaggedLate: number; flaggedLatePaid: number;
  onTimeExpected: number; onTimeExpectedPaid: number;
  daysForwarded: number;
}

export class ForwardLimit extends Error {}

export async function fastForward(owner: Profile): Promise<ForwardResult> {
  const pb = await createPBAdminClient();
  const session = await getSession(owner.id);
  if (!session) throw new Error("not a demo");
  const done = Number(session.days_forwarded) || 0;
  if (done >= MAX_FORWARDS * DAYS) throw new ForwardLimit("That's six weeks already. Start a fresh demo to go again.");
  const sim = session.sim as SimState;

  // 1. The prediction, before anything moves.
  invalidateInsights(owner.id);
  const before = await getInsights(owner.id);
  const week = before.forecast.weeks[0];
  const flagged = new Set(Object.entries(before.predictions).filter(([, p]) => p.level === "high").map(([id]) => id));
  const expectedSoon = new Set(Object.entries(before.predictions).filter(([, p]) => p.level === "low" && p.expected < addDays(before.today, DAYS)).map(([id]) => id));

  // 2. Everything moves a week into the past.
  await shiftAll(pb, owner.id);

  // 3. The week happens.
  const today = todayIST();
  const weekStart = addDays(today, -DAYS);
  const r = rng(sim.seed + done + 1);
  const invoices = (await pb.collection("invoices").getFullList({ filter: pb.filter("user = {:u}", { u: owner.id }) })) as unknown as Invoice[];
  const clients = (await pb.collection("clients").getFullList({ filter: pb.filter("user = {:u}", { u: owner.id }) })) as unknown as Client[];
  const clientById = new Map(clients.map((c) => [c.id, c]));
  const fallback = { habit: { delay: 6, spread: 6, slip: 0.1 }, terms: 15, perMonth: 0, key: "" };
  const usual = new Map<string, number>();
  for (const inv of invoices) if (inv.status === "paid") usual.set(inv.client, Math.max(usual.get(inv.client) ?? 0, inv.total));

  const events: ForwardEvent[] = [];
  const writes = pb.createBatch();
  let received = 0, writesQueued = 0;
  for (const inv of invoices.filter((i) => i.status === "sent")) {
    const h = sim.clients[inv.client] ?? fallback;
    // Unpaid as of the start of the week: when would this client pay?
    const day = drawPaymentDay(h.habit, inv.due_date, weekStart, r, inv.total / (usual.get(inv.client) || inv.total), h.terms);
    const name = clientById.get(inv.client)?.name ?? "A client";
    if (day < today) {
      const payDay = day < weekStart ? weekStart : day;
      const at = atIST(payDay, 10 + Math.floor(r() * 9), Math.floor(r() * 60));
      writes.collection("invoices").update(inv.id, { status: "paid", paid_at: at });
      writes.collection("invoice_messages").create({
        user: owner.id, client: inv.client, invoice: inv.id, kind: "client_reply", channel: "demo",
        body: `Paid ${formatCurrency(inv.total)} for ${inv.invoice_number}.`, at, ai_written: false, tone: "",
      });
      writesQueued += 2;
      received += inv.total;
      const late = daysBetween(inv.due_date, payDay);
      events.push({
        kind: "paid", flagged: flagged.has(inv.id),
        text: `${name} paid ${inv.invoice_number} (${formatCurrency(inv.total)}), ${late > 0 ? `${late} day${late === 1 ? "" : "s"} late` : late === 0 ? "on the due date" : `${-late} day${late === -1 ? "" : "s"} early`}.`,
      });
    } else if (inv.due_date < today && inv.due_date >= weekStart) {
      events.push({ kind: "late", flagged: flagged.has(inv.id), text: `${name} missed the due date for ${inv.invoice_number}.` });
    }
  }

  // Retainer clients get their next invoice when it's due.
  const lastByClient = new Map<string, string>();
  for (const inv of invoices) if (!lastByClient.has(inv.client) || inv.invoice_date > lastByClient.get(inv.client)!) lastByClient.set(inv.client, inv.invoice_date);
  const fresh = await pb.collection("users").getOne(owner.id, { fields: "invoice_counter,invoice_prefix" });
  let counter = Number(fresh.invoice_counter) || 0;
  for (const [clientId, s] of Object.entries(sim.clients)) {
    if (s.perMonth < 1) continue;
    const last = lastByClient.get(clientId);
    const next = last ? addDays(last, Math.round(30 / s.perMonth)) : null;
    if (!next || next >= today) continue;
    const date = next < weekStart ? weekStart : next;
    const c = clientById.get(clientId)!;
    const spec = DEMO_CLIENTS.find((d) => d.key === s.key)!.services[0];
    const items = [{ description: spec.description, hsn_sac: spec.hsn, quantity: 1, rate: spec.rate[0] }];
    const gst = c.gst_number ? 18 : 0;
    const supply = supplyType(owner.gst_number, owner.state, c.gst_number, c.state);
    counter++;
    const number = `${fresh.invoice_prefix}-${date.slice(0, 4)}-${String(counter).padStart(3, "0")}`;
    const inv = await pb.collection("invoices").create({
      user: owner.id, client: clientId, invoice_number: number, status: "sent", invoice_date: date,
      due_date: addDays(date, s.terms), gst_rate: gst, supply_type: supply, ...computeTotals(items, gst, supply),
      sent_at: atIST(date, 10), source: "simulated", reminder_count: 0, terms: `Payment due within ${s.terms} days.`,
    });
    writes.collection("invoice_items").create({ invoice: inv.id, ...items[0], amount: items[0].rate, sort_order: 0 });
    writes.collection("invoice_messages").create({
      user: owner.id, client: clientId, invoice: inv.id, kind: "invoice", channel: "demo", ai_written: false, tone: "",
      body: `Hi ${greetName(c.name, c.gst_number)}, here is invoice ${number} from ${owner.business_name}.\n\n*Amount:* ${formatCurrency(inv.total as number)}\n\nView and pay by UPI: /pay/${inv.id}`,
      at: atIST(date, 10),
    });
    writesQueued += 2;
    events.push({ kind: "new", text: `Sent ${c.name} their monthly invoice ${number} (${formatCurrency(inv.total as number)}).` });
  }
  await pb.collection("users").update(owner.id, { invoice_counter: counter });
  if (writesQueued) await writes.send();
  await pb.collection("invoice_demo_sessions").update(session.id, { days_forwarded: done + DAYS });
  invalidateInsights(owner.id);

  // 4. How did the prediction do?
  const paidIds = new Set(invoices.filter((i) => events.some((e) => e.kind === "paid" && e.text.includes(i.invoice_number))).map((i) => i.id));
  return {
    predicted: { p10: week?.p10 ?? 0, p50: week?.p50 ?? 0, p90: week?.p90 ?? 0 },
    received,
    events: events.sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "paid" ? -1 : b.kind === "paid" ? 1 : a.kind === "late" ? -1 : 1)),
    flaggedLate: flagged.size,
    flaggedLatePaid: [...flagged].filter((id) => paidIds.has(id)).length,
    onTimeExpected: expectedSoon.size,
    onTimeExpectedPaid: [...expectedSoon].filter((id) => paidIds.has(id)).length,
    daysForwarded: done + DAYS,
  };
}

/** Every stored date in the sandbox moves a week back. Batched, 100 writes per request. */
async function shiftAll(pb: PocketBase, userId: string) {
  const f = pb.filter("user = {:u}", { u: userId });
  const [invoices, messages] = await Promise.all([
    pb.collection("invoices").getFullList({ filter: f, fields: "id,invoice_date,due_date,sent_at,paid_at,claimed_at,last_reminder_at" }),
    pb.collection("invoice_messages").getFullList({ filter: f, fields: "id,at,created" }),
  ]);
  const ops: [string, string, Record<string, string>][] = [
    ...invoices.map((i) => ["invoices", i.id, {
      invoice_date: shiftDay(i.invoice_date), due_date: shiftDay(i.due_date), sent_at: shift(i.sent_at), paid_at: shift(i.paid_at),
      claimed_at: shift(i.claimed_at), last_reminder_at: shift(i.last_reminder_at),
    }] as [string, string, Record<string, string>]),
    ...messages.map((m) => ["invoice_messages", m.id, { at: shift(m.at || new Date(Date.parse(m.created.replace(" ", "T"))).toISOString()) }] as [string, string, Record<string, string>]),
  ];
  for (let i = 0; i < ops.length; i += 100) {
    const b = pb.createBatch();
    for (const [col, id, data] of ops.slice(i, i + 100)) b.collection(col).update(id, data);
    await b.send();
  }
}
