import { NextRequest, NextResponse } from "next/server";
import { createPBClient } from "@/lib/pb/server";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const pb = await createPBClient();
    if (!pb.authStore.isValid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = pb.authStore.model!.id as string;

    const { id } = await params;
    const invoice = await pb.collection("invoices").getOne(id);
    if (invoice.user !== userId) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await pb.collection("invoices").update(id, { status: "sent" });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
