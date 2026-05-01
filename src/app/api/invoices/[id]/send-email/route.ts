import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const resend = new Resend(process.env.RESEND_API_KEY ?? "placeholder");
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
      .select("business_name, email")
      .eq("id", user.id)
      .single();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profile = profileRaw as any;

    const client = invoice.clients as { email: string | null; name: string };
    if (!client.email) {
      return NextResponse.json({ error: "Client has no email address" }, { status: 400 });
    }

    const fmtINR = (n: number) =>
      new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(n);

    const items = invoice.invoice_items as { description: string; quantity: number; rate: number; amount: number }[];

    const itemRows = items
      .map(
        (it) => `
        <tr style="border-bottom:1px solid #27272a">
          <td style="padding:10px 0;color:#d4d4d8">${it.description}</td>
          <td style="padding:10px 0;text-align:center;color:#a1a1aa">${it.quantity}</td>
          <td style="padding:10px 0;text-align:right;color:#a1a1aa">${fmtINR(it.rate)}</td>
          <td style="padding:10px 0;text-align:right;color:#f4f4f5;font-weight:600">${fmtINR(it.amount)}</td>
        </tr>`
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
    <!-- Header -->
    <div style="background:#111113;border:1px solid rgba(255,255,255,0.07);border-radius:16px;overflow:hidden">
      <div style="background:linear-gradient(135deg,#052e16,#064e3b);padding:28px 32px;display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-size:22px;font-weight:700;color:#f0fdf4;letter-spacing:-0.5px">${profile?.business_name}</div>
          <div style="font-size:13px;color:#6ee7b7;margin-top:4px">TAX INVOICE</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:18px;font-weight:700;color:#10b981">${invoice.invoice_number}</div>
          <div style="font-size:12px;color:#6ee7b7;margin-top:2px">Due: ${invoice.due_date}</div>
        </div>
      </div>

      <div style="padding:28px 32px">
        <!-- Bill to -->
        <div style="margin-bottom:24px">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#71717a;margin-bottom:6px">Billed to</div>
          <div style="font-size:16px;font-weight:600;color:#f4f4f5">${client.name}</div>
          <div style="font-size:13px;color:#a1a1aa">${client.email}</div>
        </div>

        <!-- Items table -->
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

        <!-- Totals -->
        <div style="border-top:1px solid #3f3f46;padding-top:16px;text-align:right">
          <div style="font-size:13px;color:#a1a1aa;margin-bottom:6px">Subtotal: ${fmtINR(invoice.subtotal)}</div>
          ${invoice.gst_amount > 0 ? `<div style="font-size:13px;color:#a1a1aa;margin-bottom:10px">GST (${invoice.gst_rate}%): ${fmtINR(invoice.gst_amount)}</div>` : ""}
          <div style="font-size:22px;font-weight:700;color:#10b981">Total: ${fmtINR(invoice.total)}</div>
        </div>

        ${paymentBtn}

        ${invoice.notes ? `<div style="border-top:1px solid #27272a;padding-top:16px;margin-top:8px"><div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#71717a;margin-bottom:6px">Notes</div><div style="font-size:13px;color:#a1a1aa">${invoice.notes}</div></div>` : ""}
      </div>
    </div>

    <div style="text-align:center;margin-top:24px;font-size:12px;color:#52525b">
      Sent via InvoiceSnap · invoicesnap.in
    </div>
  </div>
</body>
</html>`;

    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "invoices@invoicesnap.in",
      to: client.email,
      subject: `Invoice ${invoice.invoice_number} from ${profile?.business_name}`,
      html,
      attachments: invoice.pdf_url
        ? [{ filename: `${invoice.invoice_number}.pdf`, path: invoice.pdf_url }]
        : undefined,
    });

    // Mark sent
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
