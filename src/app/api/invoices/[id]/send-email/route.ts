import { NextRequest, NextResponse } from "next/server";
import { createPBClient } from "@/lib/pb/server";
import { Resend } from "resend";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const resend = new Resend(process.env.RESEND_API_KEY ?? "placeholder");
  try {
    const pb = await createPBClient();
    if (!pb.authStore.isValid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = pb.authStore.model!.id as string;

    const { id } = await params;
    const invoice = await pb.collection("invoices").getOne(id, { expand: "client" });
    if (invoice.user !== userId) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    const items = await pb.collection("invoice_items").getFullList({
      filter: `invoice = "${id}"`,
      sort:   "sort_order",
    });

    const userRecord = await pb.collection("users").getOne(userId);
    const client = invoice.expand?.client as { email?: string; name: string } | null;

    if (!client?.email) {
      return NextResponse.json({ error: "Client has no email address" }, { status: 400 });
    }

    const fmtINR = (n: number) =>
      new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(n);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const typedItems = items as unknown as { description: string; quantity: number; rate: number; amount: number }[];

    const itemRows = typedItems
      .map(
        (it) => `
        <tr style="border-bottom:1px solid #27272a">
          <td style="padding:10px 0;color:#d4d4d8">${it.description}</td>
          <td style="padding:10px 0;text-align:center;color:#a1a1aa">${it.quantity}</td>
          <td style="padding:10px 0;text-align:right;color:#a1a1aa">${fmtINR(it.rate)}</td>
          <td style="padding:10px 0;text-align:right;color:#f4f4f5;font-weight:600">${fmtINR(it.amount)}</td>
        </tr>`,
      )
      .join("");

    const paymentBtn = invoice.razorpay_payment_link_url
      ? `<div style="text-align:center;margin:28px 0">
           <a href="${invoice.razorpay_payment_link_url}"
              style="display:inline-block;background:#10b981;color:#022c22;padding:12px 28px;border-radius:8px;font-weight:700;text-decoration:none;font-size:15px">
             Pay ₹${Number(invoice.total).toLocaleString("en-IN")} Online →
           </a>
         </div>`
      : "";

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#09090b;font-family:'DM Sans',Arial,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px">
    <div style="background:#111113;border:1px solid rgba(255,255,255,0.07);border-radius:16px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#052e16,#064e3b);padding:28px 32px">
        <div style="display:flex;justify-content:space-between">
          <div>
            <div style="font-size:22px;font-weight:700;color:#f0fdf4">${userRecord.business_name || "Your Business"}</div>
            <div style="font-size:13px;color:#6ee7b7;margin-top:4px">TAX INVOICE</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:18px;font-weight:700;color:#10b981">${invoice.invoice_number}</div>
            <div style="font-size:12px;color:#6ee7b7;margin-top:2px">Due: ${invoice.due_date}</div>
          </div>
        </div>
      </div>
      <div style="padding:28px 32px">
        <div style="margin-bottom:24px">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#71717a;margin-bottom:6px">Billed to</div>
          <div style="font-size:16px;font-weight:600;color:#f4f4f5">${client.name}</div>
          <div style="font-size:13px;color:#a1a1aa">${client.email}</div>
        </div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
          <thead>
            <tr style="border-bottom:1px solid #3f3f46">
              <th style="padding:8px 0;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#71717a;font-weight:500">Description</th>
              <th style="padding:8px 0;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#71717a;font-weight:500">Qty</th>
              <th style="padding:8px 0;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#71717a;font-weight:500">Rate</th>
              <th style="padding:8px 0;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#71717a;font-weight:500">Amount</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
        <div style="border-top:1px solid #3f3f46;padding-top:16px;text-align:right">
          <div style="font-size:13px;color:#a1a1aa;margin-bottom:6px">Subtotal: ${fmtINR(Number(invoice.subtotal))}</div>
          ${Number(invoice.gst_amount) > 0 ? `<div style="font-size:13px;color:#a1a1aa;margin-bottom:10px">GST (${invoice.gst_rate}%): ${fmtINR(Number(invoice.gst_amount))}</div>` : ""}
          <div style="font-size:22px;font-weight:700;color:#10b981">Total: ${fmtINR(Number(invoice.total))}</div>
        </div>
        ${paymentBtn}
        ${invoice.notes ? `<div style="border-top:1px solid #27272a;padding-top:16px;margin-top:8px"><div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#71717a;margin-bottom:6px">Notes</div><div style="font-size:13px;color:#a1a1aa">${invoice.notes}</div></div>` : ""}
      </div>
    </div>
    <div style="text-align:center;margin-top:24px;font-size:12px;color:#52525b">Sent via InvoiceSnap · invoicesnap.in</div>
  </div>
</body>
</html>`;

    await resend.emails.send({
      from:    process.env.EMAIL_FROM ?? "invoices@invoicesnap.in",
      to:      client.email,
      subject: `Invoice ${invoice.invoice_number} from ${userRecord.business_name || "Your Business"}`,
      html,
    });

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
