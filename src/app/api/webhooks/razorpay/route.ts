import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature") ?? "";
    const secret   = process.env.RAZORPAY_WEBHOOK_SECRET ?? "";

    const expected = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (expected !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);

    if (event.event === "payment_link.paid") {
      const payload = event.payload.payment_link.entity;
      const invoiceId = payload.notes?.invoice_id as string | undefined;

      if (invoiceId) {
        const supabase = await createServiceClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("invoices") as any)
          .update({ status: "paid", paid_at: new Date().toISOString() })
          .eq("id", invoiceId);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
