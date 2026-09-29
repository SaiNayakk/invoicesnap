import { NextResponse, type NextRequest } from "next/server";
import { createPBAdminClient } from "@/lib/pb/server";
import { cleanClient, listClients } from "@/lib/data";
import { asOwner, body } from "@/lib/api";
import { validateGstin } from "@/lib/gst";
import { invalidateInsights } from "@/lib/ai/insights";

export async function GET() {
  return asOwner(async (owner) => NextResponse.json({ clients: await listClients(owner.id) }));
}

export async function POST(req: NextRequest) {
  return asOwner(async (owner) => {
    const c = cleanClient(await body(req));
    if (c.gst_number) {
      const g = validateGstin(c.gst_number);
      if (!g.ok) return NextResponse.json({ error: `GSTIN: ${g.error}` }, { status: 400 });
      c.state ||= g.state;
    }
    const pb = await createPBAdminClient();
    const client = await pb.collection("clients").create({ ...c, user: owner.id, source: "manual" });
    invalidateInsights(owner.id);
    return NextResponse.json({ client }, { status: 201 });
  });
}
