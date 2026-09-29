import { NextResponse, type NextRequest } from "next/server";
import { createPBAdminClient } from "@/lib/pb/server";
import { DEMO_EMAIL_DOMAIN, effectiveStatus } from "@/lib/data";
import { invalidateInsights } from "@/lib/ai/insights";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { formatCurrency } from "@/lib/utils";
import type { Invoice } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

/** The client tapped "I've paid". The owner still confirms once the money shows up. */
export async function POST(req: NextRequest, { params }: Params) {
  if (!rateLimit(`claim-pay:${clientIp(req)}`, 10, 10 * 60_000)) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const { id } = await params;
  if (!/^[a-z0-9]{15}$/.test(id)) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  try {
    const pb = await createPBAdminClient();
    const inv = (await pb.collection("invoices").getOne(id)) as unknown as Invoice;
    const status = effectiveStatus(inv);
    if (status === "payment_pending") return NextResponse.json({ ok: true });
    if (status !== "sent" && status !== "overdue") return NextResponse.json({ error: "This invoice isn't waiting for payment." }, { status: 400 });
    await pb.collection("invoices").update(id, { status: "payment_pending", claimed_at: new Date().toISOString() });
    invalidateInsights(inv.user);
    const owner = await pb.collection("users").getOne(inv.user, { fields: "email" });
    // In a demo sandbox the client's reply shows up in the phone's chat, as it would on WhatsApp.
    if (String(owner.email).endsWith(`@${DEMO_EMAIL_DOMAIN}`)) {
      await pb.collection("invoice_messages").create({
        user: inv.user, client: inv.client, invoice: id, kind: "client_reply", channel: "demo",
        body: `Paid ${formatCurrency(inv.total)} by UPI for ${inv.invoice_number}. Please check.`, at: new Date().toISOString(),
      });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }
}
