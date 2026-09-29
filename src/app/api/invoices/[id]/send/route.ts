import { NextResponse, type NextRequest } from "next/server";
import { getInvoice, isDemoUser, logMessage, setStatus } from "@/lib/data";
import { appUrl, asOwner, fail } from "@/lib/api";
import { invoiceMessage } from "@/lib/messages";
import { whatsappLink } from "@/lib/ai/reminders";

type Params = { params: Promise<{ id: string }> };

/**
 * Marks the invoice sent and returns a click-to-chat WhatsApp link with the
 * message ready to go (no WhatsApp Business account needed). Re-sending an
 * already-sent invoice just returns the link again.
 */
export async function POST(req: NextRequest, { params }: Params) {
  return asOwner(async (owner) => {
    const found = await getInvoice(owner.id, (await params).id);
    if (!found) return fail("Not found", 404);
    const { invoice, client } = found;
    if (["paid", "cancelled"].includes(invoice.status)) return fail("This invoice is already closed.");
    if (!client.phone) return fail(`Add a phone number for ${client.name} first.`);
    const text = invoiceMessage(invoice, client, owner, `${appUrl(req)}/pay/${invoice.id}`);
    if (invoice.status === "draft") await setStatus(owner.id, invoice.id, "sent", { sent_at: new Date().toISOString() });
    await logMessage({
      user: owner.id, client: client.id, invoice: invoice.id, kind: "invoice",
      channel: isDemoUser(owner) ? "demo" : "whatsapp_link", body: text, tone: "", ai_written: false,
    });
    return NextResponse.json({ ok: true, text, whatsapp: whatsappLink(client.phone, text), demo: isDemoUser(owner) });
  });
}
