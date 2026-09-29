import { NextResponse, type NextRequest } from "next/server";
import PocketBase from "pocketbase";
import { setAuthCookie } from "@/lib/auth-cookie";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { body, fail } from "@/lib/api";

export async function POST(req: NextRequest) {
  if (!rateLimit(`register:${clientIp(req)}`, 5, 60 * 60_000)) return fail("Too many sign-ups from here. Please try later.", 429);
  const b = await body(req);
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  const password = typeof b.password === "string" ? b.password : "";
  const businessName = typeof b.business_name === "string" ? b.business_name.trim().slice(0, 80) : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Please enter a valid email.");
  if (password.length < 8) return fail("Use at least 8 characters for the password.");
  if (!businessName) return fail("Please enter your business or trading name.");
  const pb = new PocketBase(process.env.NEXT_PUBLIC_PB_URL!);
  try {
    await pb.collection("users").create({
      email, password, passwordConfirm: password, name: businessName, business_name: businessName,
      plan: "free", invoice_counter: 0, invoice_prefix: "INV", default_due_days: 15,
    });
  } catch {
    return fail("That email may already be registered. Try signing in.");
  }
  const auth = await pb.collection("users").authWithPassword(email, password);
  const res = NextResponse.json({ ok: true }, { status: 201 });
  setAuthCookie(res, auth.token, auth.record);
  return res;
}
