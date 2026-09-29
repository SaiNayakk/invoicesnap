import { NextResponse, type NextRequest } from "next/server";
import { asOwner, fail } from "@/lib/api";
import { listClients, listInvoices } from "@/lib/data";
import { getInsights } from "@/lib/ai/insights";
import { getBrief } from "@/lib/ai/brief";
import { ensureTenant } from "@/lib/ai/tenant";
import { tenantOf } from "@/lib/owner";
import { clientIp, rateLimit } from "@/lib/rate-limit";

async function load(userId: string) {
  const [ins, invoices, clients] = await Promise.all([getInsights(userId), listInvoices(userId), listClients(userId)]);
  return { ins, invoices, clients };
}

/** The stored summary if the numbers haven't changed, else just the facts. Never calls the model. */
export async function GET() {
  return asOwner(async (owner) => {
    const d = await load(owner.id);
    return NextResponse.json(await getBrief({ userId: owner.id, tenant: tenantOf(owner.id), ...d, generate: false }));
  });
}

/** Writes the summary (one model call), unless an identical set of facts was already summarised. */
export async function POST(req: NextRequest) {
  return asOwner(async (owner) => {
    if (!rateLimit(`brief:${owner.id}`, 6, 60 * 60_000) || !rateLimit(`brief-ip:${clientIp(req)}`, 12, 60 * 60_000)) {
      return fail("Please try again in a little while.", 429);
    }
    await ensureTenant(owner);
    const d = await load(owner.id);
    try {
      return NextResponse.json(await getBrief({ userId: owner.id, tenant: tenantOf(owner.id), ...d, generate: true }));
    } catch {
      return fail("The summary can't be written right now. The numbers below are still current.", 503);
    }
  });
}
