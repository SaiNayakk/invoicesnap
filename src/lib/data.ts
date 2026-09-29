/**
 * Reads and writes, always scoped to one verified user.
 *
 * Routes call `getOwner()` first (which verifies the session with PocketBase)
 * and pass the user id in; queries then run with the server's admin session
 * and bound filter parameters, so no user input is ever pasted into a filter.
 */

import { createPBAdminClient } from "@/lib/pb/server";
import { addDays, todayIST } from "@/lib/dates";
import { computeTotals, GST_SLABS, supplyType, type LineInput } from "@/lib/gst";
import type { Client, Invoice, InvoiceItem, InvoiceStatus, Message, Profile, Source } from "@/lib/types";
import { invalidateInsights } from "@/lib/ai/insights";

/** A sent invoice past its due date is overdue, whatever the stored status says. */
export function effectiveStatus(inv: Pick<Invoice, "status" | "due_date">, today = todayIST()): InvoiceStatus {
  return inv.status === "sent" && inv.due_date < today ? "overdue" : inv.status;
}

export async function listClients(userId: string): Promise<Client[]> {
  const pb = await createPBAdminClient();
  return (await pb.collection("clients").getFullList({ filter: pb.filter("user = {:u}", { u: userId }), sort: "name" })) as unknown as Client[];
}

export async function listInvoices(userId: string): Promise<Invoice[]> {
  const pb = await createPBAdminClient();
  const rows = (await pb.collection("invoices").getFullList({
    filter: pb.filter("user = {:u}", { u: userId }), sort: "-invoice_date,-invoice_number",
  })) as unknown as Invoice[];
  const today = todayIST();
  return rows.map((i) => ({ ...i, status: effectiveStatus(i, today) }));
}

export async function getInvoice(userId: string, id: string) {
  const pb = await createPBAdminClient();
  let inv: Invoice;
  try {
    inv = (await pb.collection("invoices").getOne(id)) as unknown as Invoice;
  } catch {
    return null;
  }
  if (inv.user !== userId) return null;
  const [items, client, messages] = await Promise.all([
    pb.collection("invoice_items").getFullList({ filter: pb.filter("invoice = {:i}", { i: id }), sort: "sort_order" }),
    pb.collection("clients").getOne(inv.client),
    pb.collection("invoice_messages").getFullList({ filter: pb.filter("invoice = {:i}", { i: id }), sort: "created" }),
  ]);
  return {
    invoice: { ...inv, status: effectiveStatus(inv) },
    items: items as unknown as InvoiceItem[],
    client: client as unknown as Client,
    messages: messages as unknown as Message[],
  };
}

export async function getClient(userId: string, id: string): Promise<Client | null> {
  const pb = await createPBAdminClient();
  try {
    const c = (await pb.collection("clients").getOne(id)) as unknown as Client;
    return c.user === userId ? c : null;
  } catch {
    return null;
  }
}

// ── validation ──────────────────────────────────────────────────────────────

export class InputError extends Error {}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export function cleanClient(body: Record<string, unknown>) {
  const name = str(body.name, 80);
  if (!name) throw new InputError("Please enter the client's name.");
  const phone = str(body.phone, 20).replace(/[^\d+]/g, "");
  if (phone && phone.replace(/\D/g, "").length < 10) throw new InputError("Phone numbers need 10 digits.");
  const email = str(body.email, 120).toLowerCase();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new InputError("That email doesn't look right.");
  return {
    name, phone, email,
    address: str(body.address, 200), city: str(body.city, 60), state: str(body.state, 60), pincode: str(body.pincode, 10),
    gst_number: str(body.gst_number, 15).toUpperCase(), notes: str(body.notes, 500),
  };
}

export interface InvoiceInput {
  client: string;
  items: LineInput[];
  gst_rate: number;
  invoice_date: string;
  due_date: string;
  notes: string;
  terms: string;
  source: Source;
}

export function cleanInvoice(body: Record<string, unknown>, today = todayIST()): InvoiceInput {
  const client = str(body.client, 20);
  if (!/^[a-z0-9]{15}$/.test(client)) throw new InputError("Please choose a client.");
  const raw = Array.isArray(body.items) ? body.items.slice(0, 50) : [];
  const items = raw
    .map((it: Record<string, unknown>) => ({
      description: str(it?.description, 120),
      hsn_sac: str(it?.hsn_sac, 10).replace(/\D/g, ""),
      quantity: Number(it?.quantity),
      rate: Number(it?.rate),
    }))
    .filter((it) => it.description || it.rate);
  if (!items.length) throw new InputError("Add at least one line item.");
  for (const it of items) {
    if (!it.description) throw new InputError("Every line needs a description.");
    if (!(it.quantity > 0 && it.quantity <= 100_000)) throw new InputError(`Check the quantity for "${it.description}".`);
    if (!(it.rate >= 0 && it.rate <= 10_000_000)) throw new InputError(`Check the rate for "${it.description}".`);
  }
  const gst = Number(body.gst_rate ?? 0);
  if (!(GST_SLABS as readonly number[]).includes(gst)) throw new InputError("GST must be 0, 5, 12, 18 or 28%.");
  const isDate = (d: unknown): d is string => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(d));
  const invoiceDate = isDate(body.invoice_date) ? body.invoice_date : today;
  const dueDate = isDate(body.due_date) ? body.due_date : addDays(invoiceDate, 15);
  if (dueDate < invoiceDate) throw new InputError("The due date can't be before the invoice date.");
  const source = body.source === "ai" ? "ai" : "manual";
  return { client, items, gst_rate: gst, invoice_date: invoiceDate, due_date: dueDate, notes: str(body.notes, 500), terms: str(body.terms, 500), source };
}

// ── writes ──────────────────────────────────────────────────────────────────

/** Next number in the user's series, e.g. NLS-2026-047. Counter lives on the user record. */
async function nextNumber(owner: Profile): Promise<string> {
  const pb = await createPBAdminClient();
  const fresh = await pb.collection("users").getOne(owner.id, { fields: "invoice_counter,invoice_prefix" });
  const n = (Number(fresh.invoice_counter) || 0) + 1;
  await pb.collection("users").update(owner.id, { invoice_counter: n });
  const prefix = (fresh.invoice_prefix as string) || "INV";
  return `${prefix}-${new Date().getFullYear()}-${String(n).padStart(3, "0")}`;
}

export async function createInvoice(owner: Profile, input: InvoiceInput, status: "draft" | "sent" = "draft"): Promise<Invoice> {
  const client = await getClient(owner.id, input.client);
  if (!client) throw new InputError("That client doesn't exist.");
  const pb = await createPBAdminClient();
  const supply = supplyType(owner.gst_number, owner.state, client.gst_number, client.state);
  const totals = computeTotals(input.items, input.gst_rate, supply);
  const invoice = (await pb.collection("invoices").create({
    user: owner.id, client: client.id, invoice_number: await nextNumber(owner), status,
    invoice_date: input.invoice_date, due_date: input.due_date, gst_rate: input.gst_rate, supply_type: supply,
    ...totals, notes: input.notes, terms: input.terms, source: input.source,
    sent_at: status === "sent" ? new Date().toISOString() : "", reminder_count: 0,
  })) as unknown as Invoice;
  const batch = pb.createBatch();
  input.items.forEach((it, i) =>
    batch.collection("invoice_items").create({
      invoice: invoice.id, description: it.description, hsn_sac: it.hsn_sac ?? "", quantity: it.quantity, rate: it.rate,
      amount: Math.round(it.quantity * it.rate * 100) / 100, sort_order: i,
    }),
  );
  await batch.send();
  invalidateInsights(owner.id);
  return invoice;
}

export async function setStatus(userId: string, id: string, status: InvoiceStatus, extra: Record<string, unknown> = {}) {
  const pb = await createPBAdminClient();
  await pb.collection("invoices").update(id, { status, ...extra });
  invalidateInsights(userId);
}

export async function logMessage(m: Omit<Message, "id" | "created" | "at">) {
  const pb = await createPBAdminClient();
  return (await pb.collection("invoice_messages").create({ ...m, at: new Date().toISOString() })) as unknown as Message;
}

/** Profile fields a user may edit. Plan, counter and email are not among them. */
export const PROFILE_FIELDS = [
  "business_name", "address", "city", "state", "pincode", "phone", "gst_number", "pan_number", "upi_id",
  "bank_name", "bank_account_number", "bank_ifsc", "invoice_prefix", "default_due_days",
] as const;

/** Demo sandbox accounts use this reserved domain; their "WhatsApp" messages go to the demo phone instead. */
export const DEMO_EMAIL_DOMAIN = "demo.invoicesnap.invalid";
export const isDemoUser = (p: Pick<Profile, "email">) => p.email.endsWith(`@${DEMO_EMAIL_DOMAIN}`);
