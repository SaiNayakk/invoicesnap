import { NextRequest, NextResponse } from "next/server";
import { createPBClient } from "@/lib/pb/server";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const pb = await createPBClient();
    if (!pb.authStore.isValid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = pb.authStore.model!.id as string;

    const { id } = await params;
    const invoice = await pb.collection("invoices").getOne(id, { expand: "client" });
    if (invoice.user !== userId) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    const userRecord = await pb.collection("users").getOne(userId);
    if ((userRecord.plan as string) === "free") {
      return NextResponse.json({ error: "Upgrade to Pro to send via WhatsApp" }, { status: 403 });
    }

    const client = invoice.expand?.client as { phone: string } | null;
    if (!client?.phone) return NextResponse.json({ error: "Client has no phone number" }, { status: 400 });

    const phone = String(client.phone).replace(/\D/g, "");

    const paymentLine = `\n\n💳 *Pay via UPI:* ${process.env.NEXT_PUBLIC_APP_URL}/pay/${id}`;

    const messageBody =
      `Hello! Here is your invoice from *${userRecord.business_name || "Your Business"}*.\n\n` +
      `🧾 *Invoice:* ${invoice.invoice_number}\n` +
      `📅 *Date:* ${invoice.invoice_date}\n` +
      `📆 *Due:* ${invoice.due_date}\n` +
      `💰 *Amount:* ₹${Number(invoice.total).toLocaleString("en-IN")}` +
      paymentLine +
      `\n\nThank you for your business! 🙏`;

    const waRes = await fetch(
      `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method:  "POST",
        headers: {
          Authorization:  `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to:   `91${phone.slice(-10)}`,
          type: "text",
          text: { body: messageBody },
        }),
      },
    );

    if (!waRes.ok) {
      const errData = await waRes.json();
      throw new Error((errData as { error?: { message?: string } })?.error?.message ?? "WhatsApp API error");
    }

    await pb.collection("invoices").update(id, {
      status:  "sent",
      sent_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
