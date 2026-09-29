import { NextResponse, type NextRequest } from "next/server";

const PROTECTED = ["/dashboard", "/invoices", "/clients", "/analytics", "/settings", "/demo/live", "/demo/phone"];

/** Cheap first gate: no session cookie, no app. Pages still verify the session with PocketBase. */
function hasSession(req: NextRequest): boolean {
  try {
    const raw = req.cookies.get("pb_auth")?.value;
    if (!raw) return false;
    const { token } = JSON.parse(raw) as { token?: string };
    const { exp } = JSON.parse(Buffer.from(String(token).split(".")[1], "base64url").toString());
    return exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const signedIn = hasSession(req);
  if (!signedIn && PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.redirect(new URL(pathname.startsWith("/demo") ? "/demo" : "/auth", req.url));
  }
  if (signedIn && pathname === "/auth") return NextResponse.redirect(new URL("/dashboard", req.url));
  return NextResponse.next();
}

export const config = { matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\.svg$).*)"] };
