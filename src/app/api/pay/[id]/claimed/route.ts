import { NextRequest, NextResponse } from "next/server";
import { createPBAdminClient } from "@/lib/pb/server";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const pb = await createPBAdminClient();

    const invoice = await pb.collection("invoices").getOne(id);

    if (!["sent", "overdue"].includes(invoice.status as string)) {
      return NextResponse.json({ error: "Invoice is not awaiting payment" }, { status: 400 });
    }

    await pb.collection("invoices").update(id, { status: "payment_pending" });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }
}
