import { NextResponse, type NextRequest } from "next/server";
import { cleanInvoice, createInvoice, listInvoices } from "@/lib/data";
import { asOwner, body } from "@/lib/api";

export async function GET() {
  return asOwner(async (owner) => NextResponse.json({ invoices: await listInvoices(owner.id) }));
}

/** Create a draft, or a sent invoice when `send` is true (the client then gets it on WhatsApp). */
export async function POST(req: NextRequest) {
  return asOwner(async (owner) => {
    const b = await body(req);
    const invoice = await createInvoice(owner, cleanInvoice(b), "draft");
    return NextResponse.json({ invoice }, { status: 201 });
  });
}
