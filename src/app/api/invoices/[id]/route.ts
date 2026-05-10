import { NextRequest, NextResponse } from "next/server";
import { createPBClient } from "@/lib/pb/server";

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

    return NextResponse.json({ invoice: { ...invoice, invoice_items: items } });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const pb = await createPBClient();
    if (!pb.authStore.isValid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = pb.authStore.model!.id as string;

    const { id } = await params;
    const existing = await pb.collection("invoices").getOne(id);
    if (existing.user !== userId) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const updated = await pb.collection("invoices").update(id, body);

    return NextResponse.json({ invoice: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const pb = await createPBClient();
    if (!pb.authStore.isValid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = pb.authStore.model!.id as string;

    const { id } = await params;
    const existing = await pb.collection("invoices").getOne(id);
    if (existing.user !== userId) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.status !== "draft") {
      return NextResponse.json({ error: "Only draft invoices can be deleted" }, { status: 400 });
    }

    // Delete items first (cascade not guaranteed via API)
    const items = await pb.collection("invoice_items").getFullList({ filter: `invoice = "${id}"` });
    await Promise.all(items.map((item) => pb.collection("invoice_items").delete(item.id)));
    await pb.collection("invoices").delete(id);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
