import { NextResponse, type NextRequest } from "next/server";
import { getInvoice, isDemoUser, logMessage, setStatus } from "@/lib/data";
import { asOwner, fail } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { greetName } from "@/lib/messages";

type Params = { params: Promise<{ id: string }> };

/** The owner saw the money arrive. Works whether or not the client tapped "I've paid". */
export async function POST(_req: NextRequest, { params }: Params) {
  return asOwner(async (owner) => {
    const found = await getInvoice(owner.id, (await params).id);
    if (!found) return fail("Not found", 404);
    const { invoice, client } = found;
    if (!["sent", "overdue", "payment_pending"].includes(invoice.status)) return fail("This invoice isn't waiting for payment.");
    await setStatus(owner.id, invoice.id, "paid", { paid_at: new Date().toISOString() });
    const text = `Received ${formatCurrency(invoice.total)} for ${invoice.invoice_number}. Thank you, ${greetName(client.name, client.gst_number)}!\n\n${owner.business_name || ""}`.trim();
    // In the demo the thank-you lands on the phone straight away; for real users it is a one-tap WhatsApp link.
    if (isDemoUser(owner)) await logMessage({ user: owner.id, client: client.id, invoice: invoice.id, kind: "thank_you", channel: "demo", body: text, tone: "", ai_written: false });
    return NextResponse.json({ ok: true, thankYou: text, phone: client.phone });
  });
}
