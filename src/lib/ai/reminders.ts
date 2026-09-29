/**
 * Payment reminders. Code decides who, what and how firmly; the language model
 * only words it, and if its draft fails a check the fixed template is used.
 */

import { daysBetween, formatDay } from "@/lib/dates";
import { formatCurrency } from "@/lib/utils";
import { greetName } from "@/lib/messages";
import type { Client, Invoice, Profile } from "@/lib/types";
import { ai } from "./client";

export type Tone = "friendly" | "firm" | "final";
export type Language = "en" | "hinglish";

/** Escalate with lateness and with reminders already ignored. */
export function chooseTone(inv: Pick<Invoice, "due_date" | "reminder_count">, today: string): Tone {
  const late = daysBetween(inv.due_date, today);
  const sent = inv.reminder_count || 0;
  if (late > 21 || sent >= 2) return "final";
  if (late > 7 || sent >= 1) return "firm";
  return "friendly";
}

export function reminderFacts(inv: Invoice, client: Client, owner: Profile, today: string): string[] {
  const late = daysBetween(inv.due_date, today);
  return [
    `Address the customer as: ${greetName(client.name, client.gst_number)}`,
    `Business name: ${owner.business_name || "us"}`,
    `Invoice number: ${inv.invoice_number}`,
    `Amount due: ${formatCurrency(inv.total)}`,
    `Invoice date: ${formatDay(inv.invoice_date, true)}`,
    `Due date: ${formatDay(inv.due_date, true)}`,
    late > 0 ? `Days overdue: ${late}` : late === 0 ? "Due today" : `Due in ${-late} days`,
    `Reminders already sent: ${inv.reminder_count || 0}`,
  ];
}

export function templateReminder(inv: Invoice, client: Client, owner: Profile, tone: Tone, language: Language, today: string): string {
  const first = greetName(client.name, client.gst_number);
  const amt = formatCurrency(inv.total);
  const due = formatDay(inv.due_date);
  const late = daysBetween(inv.due_date, today) > 0;
  const biz = owner.business_name || "us";
  if (language === "hinglish") {
    if (tone === "friendly") return `Hi ${first}, invoice ${inv.invoice_number} (${amt}) ${late ? `ki due date ${due} thi` : `${due} ko due hai`}. Jab time mile, yahan se pay kar dijiye: {link}\n\nThanks, ${biz}`;
    if (tone === "firm") return `Hi ${first}, invoice ${inv.invoice_number} ka payment (${amt}) ab pending hai, due date ${due} thi. Is hafte clear kar dijiye please: {link}\n\n${biz}`;
    return `Hi ${first}, invoice ${inv.invoice_number} (${amt}) abhi bhi pending hai. Payment clear hone tak aage ka kaam hold par rahega. Link: {link}\n\n${biz}`;
  }
  if (tone === "friendly") return `Hi ${first}, a quick reminder that invoice ${inv.invoice_number} for ${amt} ${late ? `was due on ${due}` : `is due on ${due}`}. You can pay here: {link}\n\nThank you, ${biz}`;
  if (tone === "firm") return `Hi ${first}, invoice ${inv.invoice_number} for ${amt} was due on ${due} and is still unpaid. Please clear it this week: {link}\n\n${biz}`;
  return `Hi ${first}, invoice ${inv.invoice_number} for ${amt} is still outstanding. We'll need to pause further work until it's cleared. Pay here: {link}\n\n${biz}`;
}

const g = globalThis as unknown as { __isDrafts?: Map<string, { text: string; ai: boolean }> };
const drafts = (g.__isDrafts ??= new Map());

/** A draft with a {link} placeholder. Cached per invoice, tone, language and reminder count. */
export async function draftReminder(opts: {
  tenant: string; inv: Invoice; client: Client; owner: Profile; tone: Tone; language: Language; today: string;
}): Promise<{ text: string; ai: boolean }> {
  const { tenant, inv, client, owner, tone, language, today } = opts;
  const key = `${inv.id}:${tone}:${language}:${inv.reminder_count || 0}`;
  const hit = drafts.get(key);
  if (hit) return hit;
  let out = { text: templateReminder(inv, client, owner, tone, language, today), ai: false };
  try {
    const r = await ai.compose(tenant, reminderFacts(inv, client, owner, today), tone, language);
    if (r.message) out = { text: r.message, ai: true };
  } catch {
    /* template it is */
  }
  drafts.set(key, out);
  if (drafts.size > 2000) drafts.delete(drafts.keys().next().value!);
  return out;
}

export function withLink(text: string, link: string) {
  return text.replace("{link}", link);
}

/** Click-to-chat: opens WhatsApp with the message ready. No Business API needed. */
export function whatsappLink(phone: string, text: string) {
  const digits = phone.replace(/\D/g, "");
  const to = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${to}?text=${encodeURIComponent(text)}`;
}
