import { NextResponse } from "next/server";
import { createPBAdminClient } from "@/lib/pb/server";
import { asOwner, fail } from "@/lib/api";
import { isDemoUser } from "@/lib/data";

/** Demo only: the sandbox's WhatsApp traffic, grouped into chats for the phone view. */
export async function GET() {
  return asOwner(async (owner) => {
    if (!isDemoUser(owner)) return fail("Only available in the live demo.", 403);
    const pb = await createPBAdminClient();
    const since = new Date(Date.now() - 45 * 86_400_000).toISOString();
    const [messages, clients] = await Promise.all([
      pb.collection("invoice_messages").getFullList({
        filter: pb.filter("user = {:u} && at >= {:s}", { u: owner.id, s: since }),
        fields: "id,client,invoice,kind,body,at,ai_written",
      }),
      pb.collection("clients").getFullList({ filter: pb.filter("user = {:u}", { u: owner.id }), fields: "id,name,phone" }),
    ]);
    const chats = clients
      .map((c) => {
        const ms = messages.filter((m) => m.client === c.id).sort((a, b) => (a.at < b.at ? -1 : 1));
        return { id: c.id, name: c.name, phone: c.phone, messages: ms.map((m) => ({ id: m.id, kind: m.kind, body: m.body, at: m.at, invoice: m.invoice, ai: m.ai_written })) };
      })
      .filter((c) => c.messages.length)
      .sort((a, b) => (a.messages.at(-1)!.at < b.messages.at(-1)!.at ? 1 : -1));
    return NextResponse.json({ business: owner.business_name, chats });
  });
}
