import { NextResponse, type NextRequest } from "next/server";
import PocketBase from "pocketbase";
import { setAuthCookie } from "@/lib/auth-cookie";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { body, fail } from "@/lib/api";

export async function POST(req: NextRequest) {
  if (!rateLimit(`login:${clientIp(req)}`, 10, 10 * 60_000)) return fail("Too many attempts. Please wait a few minutes.", 429);
  const b = await body(req);
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  const password = typeof b.password === "string" ? b.password : "";
  if (!email || !password) return fail("Enter your email and password.");
  try {
    const pb = new PocketBase(process.env.NEXT_PUBLIC_PB_URL!);
    const auth = await pb.collection("users").authWithPassword(email, password);
    const res = NextResponse.json({ ok: true });
    setAuthCookie(res, auth.token, auth.record);
    return res;
  } catch {
    return fail("That email and password don't match.", 401);
  }
}
