import { NextResponse, type NextRequest } from "next/server";
import { createSandbox, SANDBOX_TTL_MIN, SandboxLimit } from "@/lib/demo/sandbox";
import { setAuthCookie } from "@/lib/auth-cookie";
import { clientIp, rateLimit } from "@/lib/rate-limit";

/** Creates a private live sandbox and signs the visitor in as its owner. */
export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  if (process.env.NODE_ENV === "production" && !rateLimit(`demo-start:${ip}`, 3, 10 * 60_000)) {
    return NextResponse.json({ error: "Please wait a few minutes before starting another demo." }, { status: 429 });
  }
  try {
    const { auth, expiresAt } = await createSandbox(ip);
    const res = NextResponse.json({ expiresAt: expiresAt.toISOString() });
    setAuthCookie(res, auth.token, auth.record, SANDBOX_TTL_MIN * 60);
    return res;
  } catch (err) {
    if (err instanceof SandboxLimit) return NextResponse.json({ error: err.message }, { status: 429 });
    console.error("demo start failed", err);
    return NextResponse.json({ error: "Couldn't start the demo right now. Please try again." }, { status: 500 });
  }
}
