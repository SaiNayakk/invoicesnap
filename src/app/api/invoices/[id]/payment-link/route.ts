import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID ?? "placeholder",
    key_secret: process.env.RAZORPAY_KEY_SECRET ?? "placeholder",
  });
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const { data: invoice } = await supabase
      .from("invoices")
      .select("*, clients(*)")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inv = invoice as any;
    const client = inv.clients as { name: string; phone: string; email: string | null };

    const link = await razorpay.paymentLink.create({
      amount: Math.round(Number(inv.total) * 100), // paise
      currency: "INR",
      accept_partial: false,
      description: `Invoice ${inv.invoice_number}`,
      customer: {
        name:  client.name,
        contact: client.phone.replace(/\D/g, "").slice(-10),
        email: client.email ?? undefined,
      },
      notify: { sms: true, email: !!client.email },
      reminder_enable: true,
      notes: { invoice_id: id, invoice_number: inv.invoice_number },
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/invoices/${id}?paid=true`,
      callback_method: "get",
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("invoices") as any)
      .update({
        razorpay_payment_link_id:  link.id,
        razorpay_payment_link_url: link.short_url,
      })
      .eq("id", id);

    return NextResponse.json({ url: link.short_url, link_id: link.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
