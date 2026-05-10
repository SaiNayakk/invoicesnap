import { NextRequest, NextResponse } from "next/server";
import { createPBClient } from "@/lib/pb/server";

export async function GET(req: NextRequest) {
  try {
    const pb = await createPBClient();
    if (!pb.authStore.isValid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = pb.authStore.model!.id as string;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const from   = searchParams.get("from");
    const to     = searchParams.get("to");

    const filters: string[] = [`user = "${userId}"`];
    if (status && status !== "all") filters.push(`status = "${status}"`);
    if (from) filters.push(`invoice_date >= "${from}"`);
    if (to)   filters.push(`invoice_date <= "${to}"`);

    const records = await pb.collection("invoices").getFullList({
      filter:  filters.join(" && "),
      sort:    "-created",
      expand:  "client",
    });

    return NextResponse.json({ invoices: records });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const pb = await createPBClient();
    if (!pb.authStore.isValid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = pb.authStore.model!.id as string;

    const body = await req.json();
    const { items, client, gst_rate, supply_type, invoice_date, due_date, notes, terms } = body;

    // Compute totals
    const subtotal: number = items.reduce(
      (sum: number, item: { quantity: number; rate: number }) => sum + item.quantity * item.rate,
      0,
    );
    const gstAmount = (subtotal * (gst_rate ?? 0)) / 100;
    const cgst  = supply_type === "intra" ? gstAmount / 2 : 0;
    const sgst  = supply_type === "intra" ? gstAmount / 2 : 0;
    const igst  = supply_type === "inter" ? gstAmount : 0;
    const total = subtotal + gstAmount;

    // Generate invoice number from user's counter + prefix
    const userRecord = await pb.collection("users").getOne(userId);
    const counter    = (Number(userRecord.invoice_counter) || 0) + 1;
    const prefix     = (userRecord.invoice_prefix as string) || "INV";
    const invoiceNumber = `${prefix}-${new Date().getFullYear()}-${String(counter).padStart(3, "0")}`;
    await pb.collection("users").update(userId, { invoice_counter: counter });

    // Create invoice
    const invoice = await pb.collection("invoices").create({
      user:          userId,
      client,
      invoice_number: invoiceNumber,
      status:        "draft",
      invoice_date:  invoice_date ?? new Date().toISOString().split("T")[0],
      due_date,
      subtotal,
      gst_rate:      gst_rate ?? 0,
      cgst_amount:   cgst,
      sgst_amount:   sgst,
      igst_amount:   igst,
      gst_amount:    gstAmount,
      total,
      supply_type:   supply_type ?? "intra",
      notes:         notes ?? "",
      terms:         terms ?? "",
    });

    // Create line items
    await Promise.all(
      items.map(
        (
          item: { description: string; hsn_sac?: string; quantity: number; rate: number },
          i: number,
        ) =>
          pb.collection("invoice_items").create({
            invoice:     invoice.id,
            description: item.description,
            hsn_sac:     item.hsn_sac ?? "",
            quantity:    item.quantity,
            rate:        item.rate,
            amount:      item.quantity * item.rate,
            sort_order:  i,
          }),
      ),
    );

    // Optionally create Razorpay payment link (Pro+ plans)
    if ((userRecord.plan as string) !== "free") {
      try {
        const rpRes = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL}/api/invoices/${invoice.id}/payment-link`,
          { method: "POST" },
        );
        if (rpRes.ok) {
          const { url, link_id } = await rpRes.json();
          await pb.collection("invoices").update(invoice.id, {
            razorpay_payment_link_id:  link_id,
            razorpay_payment_link_url: url,
          });
        }
      } catch { /* non-fatal */ }
    }

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
