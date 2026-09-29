import { NextResponse, type NextRequest } from "next/server";
import { asOwner, body, fail } from "@/lib/api";
import { listClients } from "@/lib/data";
import { ai, AIUnavailable } from "@/lib/ai/client";
import { buildDraft } from "@/lib/ai/draft";
import { ensureTenant } from "@/lib/ai/tenant";
import { tenantOf } from "@/lib/owner";
import { todayIST } from "@/lib/dates";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** "Bill Sneha for 3 reels at 4.5k each" (or a photo of a handwritten bill) -> a checked invoice draft. */
export async function POST(req: NextRequest) {
  return asOwner(async (owner) => {
    const ip = clientIp(req);
    if (!rateLimit(`extract:${owner.id}`, 20, 60 * 60_000) || !rateLimit(`extract-ip:${ip}`, 30, 60 * 60_000)) {
      return fail("That's a lot of drafts for one hour. Please try again later, or fill the form by hand.", 429);
    }
    const b = await body(req);
    const text = typeof b.text === "string" ? b.text.slice(0, 1500) : "";
    const img = b.image as { mime?: unknown; data?: unknown } | undefined;
    const image = img && typeof img.data === "string" && IMAGE_TYPES.includes(String(img.mime))
      ? { mime: String(img.mime), data: img.data.replace(/^data:[^,]+,/, "") } : null;
    if (image && image.data.length > 5_600_000) return fail("That photo is too large. Please use one under 4 MB.");
    if (!text.trim() && !image) return fail("Type a message or add a photo first.");

    await ensureTenant(owner);
    try {
      const x = await ai.extract(tenantOf(owner.id), text, image, ip);
      if (x.refused) return fail("That message can't be turned into an invoice. Describe the work and the amounts.", 422);
      if (x.flags.includes("model_unavailable") || x.flags.includes("unusable_output")) {
        return fail("The drafting assistant is busy right now. Try again in a minute, or fill the form by hand.", 503);
      }
      const clients = await listClients(owner.id);
      const draft = buildDraft(x, clients, todayIST(), owner.default_due_days || 15);
      return NextResponse.json({ draft, transcript: x.transcript });
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (status === 429) return fail("Too many requests. Please wait a few minutes.", 429);
      if (err instanceof AIUnavailable || status === 503) return fail("Drafting from a message is unavailable right now. You can still fill the form by hand.", 503);
      if (status === 400) return fail((err as Error).message);
      throw err;
    }
  });
}
