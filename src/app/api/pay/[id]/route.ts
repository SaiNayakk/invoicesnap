import { NextRequest, NextResponse } from "next/server";
import { createPBAdminClient } from "@/lib/pb/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const pb = await createPBAdminClient();

    const invoice = await pb.collection("invoices").getOne(id);
    const user = await pb.collection("users").getOne(invoice.user as string);

    return NextResponse.json({
      invoice_number: invoice.invoice_number,
      amount: invoice.total,
      status: invoice.status,
      due_date: invoice.due_date,
      business_name: user.business_name ?? "Business",
      upi_id: user.upi_id ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }
}
