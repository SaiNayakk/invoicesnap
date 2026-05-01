import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { createClient } from "@/lib/supabase/server";
import { InvoicePDF } from "@/components/pdf/invoice-pdf";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const { data: invoice, error: invErr } = await supabase
      .from("invoices")
      .select("*, invoice_items(*), clients(*)")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (invErr || !invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inv = invoice as any;
    const pdfData = {
      ...inv,
      items:   inv.invoice_items,
      client:  inv.clients,
      profile: profile ?? { business_name: "Your Business", email: user.email },
    };

    // renderToBuffer requires a Document ReactElement — InvoicePDF returns one
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfBuffer = await renderToBuffer(InvoicePDF({ invoice: pdfData as any }) as any);

    // Optionally upload to Supabase Storage so future sends reuse the URL
    try {
      const fileName = `invoices/${user.id}/${inv.invoice_number}.pdf`;
      const { data: uploadData } = await supabase.storage
        .from("pdfs")
        .upload(fileName, pdfBuffer, { contentType: "application/pdf", upsert: true });

      if (uploadData) {
        const { data: signed } = await supabase.storage
          .from("pdfs")
          .createSignedUrl(fileName, 60 * 60 * 24 * 30); // 30 days

        if (signed?.signedUrl) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from("invoices") as any).update({ pdf_url: signed.signedUrl }).eq("id", id);
        }
      }
    } catch { /* non-fatal — still return the PDF */ }

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename="${inv.invoice_number}.pdf"`,
        "Cache-Control":       "no-store",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
