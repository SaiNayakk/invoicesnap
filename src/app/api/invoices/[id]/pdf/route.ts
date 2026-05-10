import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { createPBClient } from "@/lib/pb/server";
import { InvoicePDF } from "@/components/pdf/invoice-pdf";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const pb = await createPBClient();
    if (!pb.authStore.isValid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = pb.authStore.model!.id as string;

    const { id } = await params;
    const invoice = await pb.collection("invoices").getOne(id, { expand: "client" });
    if (invoice.user !== userId) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const items = await pb.collection("invoice_items").getFullList({
      filter: `invoice = "${id}"`,
      sort:   "sort_order",
    });

    const userRecord = await pb.collection("users").getOne(userId);

    const pdfData = {
      ...invoice,
      invoice_items: items,
      client:        invoice.expand?.client ?? null,
      profile: {
        business_name: userRecord.business_name || "Your Business",
        email:         userRecord.email,
        phone:         userRecord.phone || "",
        address:       userRecord.address || "",
        gst_number:    userRecord.gst_number || "",
        upi_id:        userRecord.upi_id || "",
        bank_name:     userRecord.bank_name || "",
        bank_account_number: userRecord.bank_account_number || "",
        bank_ifsc:     userRecord.bank_ifsc || "",
      },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfBuffer = await renderToBuffer(InvoicePDF({ invoice: pdfData as any }) as any);

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename="${invoice.invoice_number}.pdf"`,
        "Cache-Control":       "no-store",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
