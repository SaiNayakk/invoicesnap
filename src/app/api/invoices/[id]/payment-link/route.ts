import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createPBClient } from "@/lib/pb/server";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const razorpay = new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID ?? "placeholder",
    key_secret: process.env.RAZORPAY_KEY_SECRET ?? "placeholder",
  });
  try {
    const pb = await createPBClient();
    if (!pb.authStore.isValid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = pb.authStore.model!.id as string;

    const { id } = await params;
    const invoice = await pb.collection("invoices").getOne(id, { expand: "client" });
    if (invoice.user !== userId) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const client = invoice.expand?.client as { name: string; phone: string; email?: string } | null;
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

    const link = await razorpay.paymentLink.create({
      amount:           Math.round(Number(invoice.total) * 100), // paise
      currency:         "INR",
      accept_partial:   false,
      description:      `Invoice ${invoice.invoice_number}`,
      customer: {
        name:    client.name,
        contact: String(client.phone).replace(/\D/g, "").slice(-10),
        email:   client.email ?? undefined,
      },
      notify:           { sms: true, email: !!client.email },
      reminder_enable:  true,
      notes:            { invoice_id: id, invoice_number: invoice.invoice_number },
      callback_url:     `${process.env.NEXT_PUBLIC_APP_URL}/invoices/${id}?paid=true`,
      callback_method:  "get",
    });

    await pb.collection("invoices").update(id, {
      razorpay_payment_link_id:  link.id,
      razorpay_payment_link_url: link.short_url,
    });

    return NextResponse.json({ url: link.short_url, link_id: link.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
