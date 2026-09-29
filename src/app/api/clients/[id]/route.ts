import { NextResponse, type NextRequest } from "next/server";
import { createPBAdminClient } from "@/lib/pb/server";
import { cleanClient, getClient } from "@/lib/data";
import { asOwner, body, fail } from "@/lib/api";
import { validateGstin } from "@/lib/gst";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  return asOwner(async (owner) => {
    const client = await getClient(owner.id, (await params).id);
    if (!client) return fail("Not found", 404);
    const c = cleanClient(await body(req));
    if (c.gst_number) {
      const g = validateGstin(c.gst_number);
      if (!g.ok) return fail(`GSTIN: ${g.error}`);
      c.state ||= g.state;
    }
    const pb = await createPBAdminClient();
    return NextResponse.json({ client: await pb.collection("clients").update(client.id, c) });
  });
}
