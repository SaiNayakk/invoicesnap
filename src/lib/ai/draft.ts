/**
 * Turns a checked extraction into a draft for the invoice builder: finds the
 * client among existing ones, applies the business's default terms, and
 * explains anything the user should look at before saving.
 */

import { addDays } from "../dates.ts";

export interface DraftClient { id: string; name: string; phone: string }
export interface ExtractionLike {
  client: { name: string; phone: string; email: string };
  items: { description: string; quantity: number; rate: number; flags: string[] }[];
  gst_rate: number | null;
  due_in_days: number | null;
  due_date: string | null;
  notes: string;
  flags: string[];
  dropped: number;
}

export interface Draft {
  clientId: string | null;
  newClient: { name: string; phone: string; email: string } | null;
  matchNote: string | null;
  items: { description: string; quantity: number; rate: number; note: string | null }[];
  gstRate: number;
  dueDate: string;
  notes: string;
  warnings: string[];
}

const SUFFIX = /\b(pvt|private|ltd|limited|llp|co|company|and|&|the|ji|sir|madam|mam|bhai|anna)\b/g;
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s&]/g, " ").replace(SUFFIX, " ").split(/\s+/).filter(Boolean);

/** 1 for an exact phone or name match; token overlap otherwise. A lone first name matches only if it's unambiguous. */
export function matchClient(name: string, phone: string, clients: DraftClient[]): { client: DraftClient; score: number } | null {
  const digits = phone.replace(/\D/g, "").slice(-10);
  if (digits.length === 10) {
    const byPhone = clients.find((c) => c.phone.replace(/\D/g, "").slice(-10) === digits);
    if (byPhone) return { client: byPhone, score: 1 };
  }
  const q = norm(name);
  if (!q.length) return null;
  let best: { client: DraftClient; score: number } | null = null;
  for (const c of clients) {
    const t = norm(c.name);
    const shared = q.filter((w) => t.some((x) => x === w || (w.length >= 4 && x.startsWith(w)))).length;
    const score = shared / Math.max(q.length, Math.min(t.length, 2));
    if (!best || score > best.score) best = { client: c, score };
  }
  if (!best || best.score < 0.5) return null;
  if (q.length === 1) {
    const same = clients.filter((c) => norm(c.name).some((x) => x === q[0] || (q[0].length >= 4 && x.startsWith(q[0]))));
    if (same.length > 1) return null; // "Priya" when there are two Priyas: let the user pick
  }
  return best;
}

const NOTES: Record<string, string> = {
  price_missing: "No price in the message. Please add one.",
  quantity_unverified: "Quantity wasn't clear, set to 1.",
  description_unverified: "Worded differently from the message. Check it.",
};

export function buildDraft(x: ExtractionLike, clients: DraftClient[], today: string, defaultDueDays: number): Draft {
  const warnings: string[] = [];
  const m = x.client.name || x.client.phone ? matchClient(x.client.name, x.client.phone, clients) : null;
  let matchNote: string | null = null;
  if (m && m.score < 1 && m.client.name.toLowerCase() !== x.client.name.toLowerCase()) matchNote = `Matched "${x.client.name}" to ${m.client.name}.`;
  if (!m && !x.client.name) warnings.push("No client named in the message. Pick one.");

  const due = x.due_date && x.due_date >= today ? x.due_date : addDays(today, x.due_in_days ?? defaultDueDays);
  if (x.flags.includes("due_unverified")) warnings.push("The due date in the message wasn't clear, so your default terms were used.");
  if (x.flags.includes("gst_rate_invalid")) warnings.push("The GST rate mentioned isn't a valid slab. Please pick one.");
  if (x.flags.includes("client_not_in_message")) warnings.push("Couldn't find the client's name in the message.");
  if (x.dropped > 0) warnings.push(`${x.dropped} line${x.dropped === 1 ? "" : "s"} left out because the price wasn't in the message.`);
  if (x.flags.includes("from_photo")) warnings.push("Read from a photo. Check the amounts against it.");
  if (!x.items.length) warnings.push("Couldn't find any items with prices. Try describing the work and the amount.");

  return {
    clientId: m?.client.id ?? null,
    newClient: m ? null : x.client.name ? { name: x.client.name, phone: x.client.phone, email: x.client.email } : null,
    matchNote,
    items: x.items.map((it) => ({
      description: it.description, quantity: it.quantity, rate: it.rate,
      note: it.flags.map((f) => NOTES[f]).filter(Boolean)[0] ?? null,
    })),
    gstRate: x.gst_rate ?? 0,
    dueDate: due,
    notes: x.notes,
    warnings,
  };
}
