import { NextResponse, type NextRequest } from "next/server";
import { getOwner } from "@/lib/owner";
import { InputError } from "@/lib/data";
import type { Profile } from "@/lib/types";

export const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function body(req: NextRequest): Promise<Record<string, unknown>> {
  try {
    const b = await req.json();
    return b && typeof b === "object" && !Array.isArray(b) ? b : {};
  } catch {
    return {};
  }
}

/**
 * Runs an owner-only handler. Errors meant for the user (InputError) are shown;
 * anything else is logged and replaced with a generic message, so internals
 * (PocketBase errors, stack traces) never reach the browser.
 */
export async function asOwner(fn: (owner: Profile) => Promise<Response>): Promise<Response> {
  const owner = await getOwner();
  if (!owner) return fail("Please sign in again.", 401);
  try {
    return await fn(owner);
  } catch (err) {
    if (err instanceof InputError) return fail(err.message);
    console.error(err);
    return fail("Something went wrong. Please try again.", 500);
  }
}

/** Absolute base URL for links sent to clients: the configured app URL, else this request's origin. */
export function appUrl(req: NextRequest): string {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || req.nextUrl.origin;
}
