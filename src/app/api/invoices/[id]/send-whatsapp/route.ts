import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: invoiceRaw, error: invErr } = await (supabase.from("invoices") as any)
      .select("*, invoice_items(*), clients(*)")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();
    if (invErr || !invoiceRaw) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const invoice = invoiceRaw as any;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profileRaw } = await (supabase.from("profiles") as any)
      .select("business_name, plan")
      .eq("id", user.id)
      .single();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profile = profileRaw as any;

    if (profile?.plan === "free") {
      return NextResponse.json({ error: "Upgrade to Pro to send via WhatsApp" }, { status: 403 });
    }

    const client = invoice.clients as { phone: string };
    const phone = client.phone.replace(/\D/g, "");

    const paymentLine = invoice.razorpay_payment_link_url
      ? `\n\n💳 *Pay online:* ${invoice.razorpay_payment_link_url}`
      : "";
    const pdfLine = invoice.pdf_url ? `\n📄 *Invoice PDF:* ${invoice.pdf_url}` : "";

    const messageBody =
      `Hello! Here is your invoice from *${profile?.business_name}*.\n\n` +
      `🧾 *Invoice:* ${invoice.invoice_number}\n` +
      `📅 *Date:* ${invoice.invoice_date}\n` +
      `📆 *Due:* ${invoice.due_date}\n` +
      `💰 *Amount:* ₹${Number(invoice.total).toLocaleString("en-IN")}` +
      paymentLine + pdfLine +
      `\n\nThank you for your business! 🙏`;

    const waRes = await fetch(
      `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: `91${phone.slice(-10)}`,
          type: "text",
          text: { body: messageBody },
        }),
      }
    );

    if (!waRes.ok) {
      const err = await waRes.json();
      throw new Error(err?.error?.message ?? "WhatsApp API error");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("invoices") as any)
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", id);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
