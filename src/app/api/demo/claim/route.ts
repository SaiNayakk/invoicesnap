import { NextResponse, type NextRequest } from "next/server";
import { asOwner, body, fail } from "@/lib/api";
import { isDemoUser } from "@/lib/data";
import { claimSandbox } from "@/lib/demo/sandbox";
import { setAuthCookie } from "@/lib/auth-cookie";
import { clientIp, rateLimit } from "@/lib/rate-limit";

/** "Keep this account": the sandbox becomes the visitor's real account. */
export async function POST(req: NextRequest) {
  if (!rateLimit(`claim:${clientIp(req)}`, 5, 10 * 60_000)) return fail("Too many attempts", 429);
  return asOwner(async (owner) => {
    if (!isDemoUser(owner)) return fail("Nothing to keep.", 403);
    const b = await body(req);
    const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
    const password = typeof b.password === "string" ? b.password : "";
    const name = typeof b.name === "string" ? b.name.trim().slice(0, 80) : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.endsWith(".invalid")) return fail("Please enter a valid email.");
    if (password.length < 8) return fail("Password must be at least 8 characters.");
    if (!name) return fail("Please enter your business name.");
    try {
      const auth = await claimSandbox(owner.id, email, password, name);
      const res = NextResponse.json({ ok: true });
      setAuthCookie(res, auth.token, auth.record);
      return res;
    } catch (err) {
      console.error("claim failed", err);
      return fail(err instanceof Error && /email/i.test(err.message) ? "That email is already registered. Please sign in instead." : "Couldn't save your account. Please try again.");
    }
  });
}
