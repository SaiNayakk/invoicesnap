import { NextResponse, type NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getInvoice } from "@/lib/data";
import { asOwner, fail } from "@/lib/api";
import { InvoicePDF } from "@/components/pdf/invoice-pdf";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  return asOwner(async (owner) => {
    const found = await getInvoice(owner.id, (await params).id);
    if (!found) return fail("Not found", 404);
    const { invoice, items, client } = found;
    const pdfData = {
      ...invoice,
      items,
      client,
      profile: {
        business_name: owner.business_name || "Your Business", email: owner.email, phone: owner.phone, address: owner.address,
        city: owner.city, state: owner.state, pincode: owner.pincode, gst_number: owner.gst_number, pan_number: owner.pan_number,
        upi_id: owner.upi_id, bank_name: owner.bank_name, bank_account_number: owner.bank_account_number, bank_ifsc: owner.bank_ifsc,
      },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdf = await renderToBuffer(InvoicePDF({ invoice: pdfData as any }) as any);
    return new NextResponse(pdf as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${invoice.invoice_number.replace(/[^\w-]/g, "")}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  });
}
