import { NextResponse, type NextRequest } from "next/server";
import { getInvoice, isDemoUser, logMessage, setStatus } from "@/lib/data";
import { appUrl, asOwner, body, fail } from "@/lib/api";
import { chooseTone, draftReminder, whatsappLink, withLink, type Language, type Tone } from "@/lib/ai/reminders";
import { tenantOf } from "@/lib/owner";
import { ensureTenant } from "@/lib/ai/tenant";
import { todayIST } from "@/lib/dates";
import { clientIp, rateLimit } from "@/lib/rate-limit";

type Params = { params: Promise<{ id: string }> };
const TONES: Tone[] = ["friendly", "firm", "final"];

/**
 * POST {tone?, language?}            -> a draft (AI-worded when possible, else a template)
 * POST {send: true, text}            -> records the reminder and returns the WhatsApp link
 */
export async function POST(req: NextRequest, { params }: Params) {
  return asOwner(async (owner) => {
    const found = await getInvoice(owner.id, (await params).id);
    if (!found) return fail("Not found", 404);
    const { invoice, client } = found;
    if (!["sent", "overdue"].includes(invoice.status)) return fail("Reminders are for invoices that are still unpaid.");
    const b = await body(req);
    const today = todayIST();
    const link = `${appUrl(req)}/pay/${invoice.id}`;

    if (b.send === true) {
      const text = typeof b.text === "string" ? b.text.trim().slice(0, 1000) : "";
      if (!text) return fail("The message is empty.");
      if (!client.phone) return fail(`Add a phone number for ${client.name} first.`);
      const final = text.includes("{link}") ? withLink(text, link) : text.includes(link) ? text : `${text}\n\n${link}`;
      const tone = TONES.includes(b.tone as Tone) ? (b.tone as string) : "";
      await logMessage({
        user: owner.id, client: client.id, invoice: invoice.id, kind: "reminder",
        channel: isDemoUser(owner) ? "demo" : "whatsapp_link", body: final, tone, ai_written: b.ai === true,
      });
      await setStatus(owner.id, invoice.id, invoice.status, {
        reminder_count: (invoice.reminder_count || 0) + 1, last_reminder_at: new Date().toISOString(),
      });
      return NextResponse.json({ ok: true, whatsapp: whatsappLink(client.phone, final) });
    }

    if (!rateLimit(`remind:${owner.id}`, 20, 60 * 60_000) || !rateLimit(`remind-ip:${clientIp(req)}`, 30, 60 * 60_000)) {
      return fail("You've drafted a lot of reminders. Please try again in a while.", 429);
    }
    const suggested = chooseTone(invoice, today);
    const tone = TONES.includes(b.tone as Tone) ? (b.tone as Tone) : suggested;
    const language: Language = b.language === "hinglish" ? "hinglish" : "en";
    await ensureTenant(owner);
    const draft = await draftReminder({ tenant: tenantOf(owner.id), inv: invoice, client, owner, tone, language, today });
    return NextResponse.json({ text: draft.text, ai: draft.ai, tone, suggested, language, preview: withLink(draft.text, link) });
  });
}
