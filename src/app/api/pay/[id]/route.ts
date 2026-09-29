import { NextResponse, type NextRequest } from "next/server";
import { createPBAdminClient } from "@/lib/pb/server";
import { effectiveStatus } from "@/lib/data";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import type { Invoice } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

/** Public: what a client needs to pay one invoice. The 15-character id in the link is the only key. */
export async function GET(req: NextRequest, { params }: Params) {
  if (!rateLimit(`pay:${clientIp(req)}`, 60, 60_000)) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const { id } = await params;
  if (!/^[a-z0-9]{15}$/.test(id)) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  try {
    const pb = await createPBAdminClient();
    const inv = (await pb.collection("invoices").getOne(id)) as unknown as Invoice;
    if (inv.status === "draft" || inv.status === "cancelled") throw new Error("not visible");
    const [user, client, items] = await Promise.all([
      pb.collection("users").getOne(inv.user, { fields: "business_name,upi_id,city" }),
      pb.collection("clients").getOne(inv.client, { fields: "name" }),
      pb.collection("invoice_items").getFullList({ filter: pb.filter("invoice = {:i}", { i: id }), sort: "sort_order", fields: "description,quantity,rate,amount" }),
    ]);
    return NextResponse.json({
      invoice_number: inv.invoice_number, invoice_date: inv.invoice_date, due_date: inv.due_date,
      status: effectiveStatus(inv), subtotal: inv.subtotal, gst_amount: inv.gst_amount, gst_rate: inv.gst_rate, total: inv.total,
      business_name: user.business_name || "Business", business_city: user.city || "", upi_id: user.upi_id || null,
      client_name: client.name, items,
    });
  } catch {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }
}
