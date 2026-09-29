/**
 * Live demo sandboxes. Each visitor gets a real, private InvoiceSnap account:
 * a studio profile, 14 clients, a year of invoices and payments, and the last
 * month's WhatsApp messages, so every screen, model and AI feature runs on the
 * real code paths. Sandboxes expire and are deleted with everything in them.
 */

import { createHash, randomBytes } from "crypto";
import PocketBase from "pocketbase";
import { createPBAdminClient } from "@/lib/pb/server";
import { addDays, todayIST } from "@/lib/dates";
import { computeTotals, supplyType } from "@/lib/gst";
import { formatCurrency } from "@/lib/utils";
import { greetName } from "@/lib/messages";
import { DEMO_EMAIL_DOMAIN } from "@/lib/data";
import { getInsights, invalidateInsights } from "@/lib/ai/insights";
import { ensureTenant } from "@/lib/ai/tenant";
import { tenantOf } from "@/lib/owner";
import { ai } from "@/lib/ai/client";
import type { Profile } from "@/lib/types";
import { DEMO_BUSINESS, DEMO_CLIENTS, simulateHistory, type Habit, type SimInvoice } from "./simulate";

export const SANDBOX_TTL_MIN = 45;
// Local development has one IP for every test run, so the per-visitor cap only applies in production.
const MAX_PER_IP_PER_DAY = process.env.NODE_ENV === "production" ? 5 : Infinity;
const MAX_ACTIVE = 40;

export interface SimState {
  clients: Record<string, { habit: Habit; terms: number; perMonth: number; key: string }>;
  seed: number;
}

export const hashIp = (ip: string) =>
  createHash("sha256").update(`${process.env.DEMO_SECRET ?? "demo"}:${ip}`).digest("hex").slice(0, 32);
const code = (n: number) => randomBytes(n * 2).toString("base64url").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, n);
const pbDate = (d: Date) => d.toISOString().replace("T", " ");

export class SandboxLimit extends Error {}

/** A time on a given India-time date, as an ISO timestamp (hour in IST). */
export function atIST(date: string, hour: number, minute = 0): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + ((hour - 5.5) * 60 + minute) * 60_000).toISOString();
}

export async function createSandbox(ip: string) {
  const pb = await createPBAdminClient();
  await cleanupExpired(pb);

  const ipHash = hashIp(ip);
  const since = pbDate(new Date(Date.now() - 86_400_000));
  const recent = await pb.collection("invoice_demo_sessions").getList(1, 1, { filter: pb.filter("ip_hash = {:h} && created >= {:s}", { h: ipHash, s: since }) });
  if (recent.totalItems >= MAX_PER_IP_PER_DAY) throw new SandboxLimit("You've started several demos today. Please try again tomorrow, or sign up to keep one.");
  const active = await pb.collection("invoice_demo_sessions").getList(1, 1, { filter: pb.filter("expires_at > {:now} && claimed = false", { now: pbDate(new Date()) }) });
  if (active.totalItems >= MAX_ACTIVE) throw new SandboxLimit("The live demo is busy right now. Please try again in a few minutes.");

  const expiresAt = new Date(Date.now() + SANDBOX_TTL_MIN * 60_000);
  const password = randomBytes(24).toString("base64url");
  const email = `demo-${code(10)}@${DEMO_EMAIL_DOMAIN}`;
  const user = await pb.collection("users").create({
    email, password, passwordConfirm: password, emailVisibility: false,
    ...DEMO_BUSINESS, plan: "pro", invoice_counter: 0,
  });
  // Recorded first, so a crash half-way still gets cleaned up.
  const session = await pb.collection("invoice_demo_sessions").create({
    ip_hash: ipHash, user_id: user.id, expires_at: pbDate(expiresAt), claimed: false, days_forwarded: 0,
  });

  try {
    const sim = await seed(pb, user.id);
    await pb.collection("invoice_demo_sessions").update(session.id, { sim });
    const auth = await new PocketBase(process.env.NEXT_PUBLIC_PB_URL!).collection("users").authWithPassword(email, password);
    const owner = auth.record as unknown as Profile;
    await ensureTenant(owner);
    await getInsights(user.id).catch(() => {}); // warm the models for the first paint
    return { auth, expiresAt };
  } catch (err) {
    await pb.collection("users").delete(user.id).catch(() => {}); // cascades to everything else
    throw err;
  }
}

async function seed(pb: PocketBase, userId: string): Promise<SimState> {
  const today = todayIST();

  const clientIds: Record<string, string> = {};
  const cb = pb.createBatch();
  for (const c of DEMO_CLIENTS) {
    cb.collection("clients").create({
      user: userId, name: c.name, phone: c.phone, email: c.email, city: c.city, state: c.state,
      gst_number: c.gst_number, source: "simulated",
    });
  }
  const created = await cb.send();
  DEMO_CLIENTS.forEach((c, i) => (clientIds[c.key] = (created[i].body as { id: string }).id));

  // A lively but believable book: some money due soon, a few invoices late, one badly.
  let history: SimInvoice[] = [];
  let seedN = 0;
  for (let attempt = 0; attempt < 12; attempt++) {
    seedN = Math.floor(Math.random() * 1e9);
    history = simulateHistory({ today, seed: seedN });
    const open = history.filter((h) => !h.paid_on);
    const late = open.filter((h) => h.due_date < today);
    if (open.length >= 9 && open.length <= 18 && late.length >= 3 && late.length <= 8) break;
  }

  const byKey = new Map(DEMO_CLIENTS.map((c) => [c.key, c]));
  const counters: Record<string, number> = {};
  const invRows = history.map((h) => {
    const c = byKey.get(h.client)!;
    const year = h.invoice_date.slice(0, 4);
    counters[year] = (counters[year] ?? 0) + 1;
    const supply = supplyType(DEMO_BUSINESS.gst_number, DEMO_BUSINESS.state, c.gst_number, c.state);
    const lateNow = !h.paid_on && h.due_date < today;
    // Owners chase late invoices: roughly one reminder per ten days late, at most three.
    const reminders = lateNow ? Math.min(3, Math.floor((Date.parse(today) - Date.parse(h.due_date)) / (10 * 86_400_000)) + (Math.random() < 0.5 ? 1 : 0)) : 0;
    return {
      user: userId, client: clientIds[h.client], invoice_number: `${DEMO_BUSINESS.invoice_prefix}-${year}-${String(counters[year]).padStart(3, "0")}`,
      status: h.paid_on ? "paid" : "sent", invoice_date: h.invoice_date, due_date: h.due_date,
      gst_rate: h.gst_rate, supply_type: supply, ...computeTotals(h.items, h.gst_rate, supply),
      sent_at: atIST(h.invoice_date, h.sent_hour), paid_at: h.paid_on ? atIST(h.paid_on, 10 + (h.sent_hour % 9), 17) : "",
      reminder_count: reminders, last_reminder_at: reminders ? atIST(addDays(today, -Math.floor(Math.random() * 5) - 1), 11) : "",
      terms: `Payment due within ${c.terms} days.`, source: "simulated", notes: "",
    };
  });
  const year = today.slice(0, 4);
  await pb.collection("users").update(userId, { invoice_counter: counters[year] ?? 0 });

  const invIds: string[] = [];
  for (let i = 0; i < invRows.length; i += 100) {
    const b = pb.createBatch();
    for (const row of invRows.slice(i, i + 100)) b.collection("invoices").create(row);
    for (const r of await b.send()) invIds.push((r.body as { id: string }).id);
  }
  const itemRows = history.flatMap((h, i) => h.items.map((it, k) => ({
    invoice: invIds[i], description: it.description, hsn_sac: it.hsn_sac, quantity: it.quantity, rate: it.rate,
    amount: it.quantity * it.rate, sort_order: k,
  })));
  // The last month of WhatsApp traffic, so the phone has real conversations in it.
  const recentFrom = addDays(today, -30);
  const link = (i: number) => `/pay/${invIds[i]}`;
  const msgRows: Record<string, unknown>[] = [];
  history.forEach((h, i) => {
    const row = invRows[i];
    const c = byKey.get(h.client)!;
    const first = greetName(c.name, c.gst_number);
    if (h.invoice_date >= recentFrom) {
      msgRows.push({ kind: "invoice", body: `Hi ${first}, here is invoice ${row.invoice_number} from ${DEMO_BUSINESS.business_name}.\n\n*Amount:* ${formatCurrency(row.total)}\n\nView and pay by UPI: ${link(i)}`, at: row.sent_at, i });
    }
    if (h.paid_on && h.paid_on >= recentFrom) {
      msgRows.push({ kind: "client_reply", body: `Paid ${formatCurrency(row.total)} for ${row.invoice_number}.`, at: row.paid_at, i });
    }
    if (row.reminder_count) {
      msgRows.push({ kind: "reminder", body: `Hi ${first}, a reminder that invoice ${row.invoice_number} for ${formatCurrency(row.total)} is past due. You can pay here: ${link(i)}`, at: row.last_reminder_at, i });
    }
  });
  const rows = [
    ...itemRows.map((r) => ["invoice_items", r] as const),
    ...msgRows.map(({ i, ...m }) => ["invoice_messages", {
      ...m, user: userId, client: invRows[i as number].client, invoice: invIds[i as number], channel: "demo", ai_written: false, tone: "",
    }] as const),
  ];
  for (let i = 0; i < rows.length; i += 100) {
    const b = pb.createBatch();
    for (const [col, r] of rows.slice(i, i + 100)) b.collection(col).create(r);
    await b.send();
  }

  return {
    seed: seedN,
    clients: Object.fromEntries(DEMO_CLIENTS.map((c) => [clientIds[c.key], { habit: c.habit, terms: c.terms, perMonth: c.perMonth, key: c.key }])),
  };
}

/** Delete expired sandboxes. Deleting the user cascades to clients, invoices, items, messages and briefs. */
export async function cleanupExpired(pb?: PocketBase) {
  pb ??= await createPBAdminClient();
  const expired = await pb.collection("invoice_demo_sessions").getFullList({
    filter: pb.filter("expires_at < {:now} && claimed = false", { now: pbDate(new Date()) }),
  });
  for (const s of expired) {
    if (s.user_id) {
      await ai.deleteTenant(tenantOf(s.user_id)).catch(() => {});
      await pb.collection("users").delete(s.user_id).catch(() => {});
    }
    await pb.collection("invoice_demo_sessions").delete(s.id).catch(() => {});
  }
  return expired.length;
}

export async function getSession(userId: string) {
  const pb = await createPBAdminClient();
  try {
    return await pb.collection("invoice_demo_sessions").getFirstListItem(pb.filter("user_id = {:u} && claimed = false", { u: userId }));
  } catch {
    return null;
  }
}

/** "Keep this account": a real login, simulated clients and invoices cleared, the visitor's own work kept. */
export async function claimSandbox(userId: string, email: string, password: string, businessName: string) {
  const pb = await createPBAdminClient();
  const session = await getSession(userId);
  if (!session) throw new Error("no session");
  await pb.collection("users").update(userId, { email, password, passwordConfirm: password, business_name: businessName, name: businessName, plan: "free" });
  // Simulated clients cascade to their invoices, items and messages.
  const sims = await pb.collection("clients").getFullList({ filter: pb.filter('user = {:u} && source = "simulated"', { u: userId }), fields: "id" });
  const theirInvoices = await pb.collection("invoices").getFullList({ filter: pb.filter("user = {:u}", { u: userId }), fields: "id,client,source" });
  const keepClients = new Set(theirInvoices.filter((i) => i.source !== "simulated").map((i) => i.client as string));
  for (const c of sims) if (!keepClients.has(c.id)) await pb.collection("clients").delete(c.id);
  for (const i of theirInvoices) if (i.source === "simulated" && keepClients.has(i.client as string)) await pb.collection("invoices").delete(i.id);
  const briefs = await pb.collection("invoice_briefs").getFullList({ filter: pb.filter("user = {:u}", { u: userId }), fields: "id" });
  for (const b of briefs) await pb.collection("invoice_briefs").delete(b.id);
  await pb.collection("invoice_demo_sessions").update(session.id, { claimed: true });
  invalidateInsights(userId);
  return new PocketBase(process.env.NEXT_PUBLIC_PB_URL!).collection("users").authWithPassword(email, password);
}
