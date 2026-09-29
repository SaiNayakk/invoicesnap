import { NextResponse } from "next/server";
import { asOwner, fail } from "@/lib/api";
import { isDemoUser } from "@/lib/data";
import { fastForward, ForwardLimit } from "@/lib/demo/forward";
import { rateLimit } from "@/lib/rate-limit";

/** Demo only: a week passes. Returns what the models predicted and what actually happened. */
export async function POST() {
  return asOwner(async (owner) => {
    if (!isDemoUser(owner)) return fail("Only available in the live demo.", 403);
    if (!rateLimit(`forward:${owner.id}`, 1, 3_000)) return fail("One week at a time, please.", 429);
    try {
      return NextResponse.json(await fastForward(owner));
    } catch (err) {
      if (err instanceof ForwardLimit) return fail(err.message);
      throw err;
    }
  });
}
