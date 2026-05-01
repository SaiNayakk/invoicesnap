import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const from = searchParams.get("from");
    const to   = searchParams.get("to");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase.from("invoices_with_client" as "invoices") as any)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (status && status !== "all") query = query.eq("status", status);
    if (from) query = query.gte("invoice_date", from);
    if (to)   query = query.lte("invoice_date", to);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ invoices: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { items, client_id, gst_rate, supply_type, invoice_date, due_date, notes, terms } = body;

    const subtotal: number = items.reduce(
      (sum: number, item: { quantity: number; rate: number }) => sum + item.quantity * item.rate, 0
    );
    const gstAmount = (subtotal * (gst_rate ?? 0)) / 100;
    const cgst = supply_type === "intra" ? gstAmount / 2 : 0;
    const sgst = supply_type === "intra" ? gstAmount / 2 : 0;
    const igst = supply_type === "inter" ? gstAmount : 0;
    const total = subtotal + gstAmount;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: invNum } = await (supabase as any).rpc("next_invoice_number", { p_user_id: user.id });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: invoiceRaw, error: invError } = await (supabase.from("invoices") as any)
      .insert({
        user_id: user.id,
        client_id,
        invoice_number: invNum as string,
        status: "draft",
        invoice_date: invoice_date ?? new Date().toISOString().split("T")[0],
        due_date,
        subtotal,
        gst_rate: gst_rate ?? 0,
        cgst_amount: cgst,
        sgst_amount: sgst,
        igst_amount: igst,
        gst_amount: gstAmount,
        total,
        supply_type: supply_type ?? "intra",
        notes: notes ?? null,
        terms: terms ?? null,
      })
      .select()
      .single();

    if (invError) throw invError;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const invoice = invoiceRaw as any;

    const { error: itemsError } = await supabase.from("invoice_items").insert(
      items.map((item: { description: string; hsn_sac?: string; quantity: number; rate: number }, i: number) => ({
        invoice_id:  invoice.id,
        description: item.description,
        hsn_sac:     item.hsn_sac ?? null,
        quantity:    item.quantity,
        rate:        item.rate,
        amount:      item.quantity * item.rate,
        sort_order:  i,
      }))
    );
    if (itemsError) throw itemsError;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profileRaw } = await (supabase.from("profiles") as any)
      .select("plan, business_name")
      .eq("id", user.id)
      .single();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profile = profileRaw as any;

    if (profile?.plan !== "free") {
      try {
        const rpRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/invoices/${invoice.id}/payment-link`, {
          method: "POST",
        });
        if (rpRes.ok) {
          const { url, link_id } = await rpRes.json();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from("invoices") as any).update({
            razorpay_payment_link_id: link_id,
            razorpay_payment_link_url: url,
          }).eq("id", invoice.id);
        }
      } catch { /* non-fatal */ }
    }

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
