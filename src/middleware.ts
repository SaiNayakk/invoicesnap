import { NextResponse, type NextRequest } from "next/server";
import PocketBase from "pocketbase";

const PROTECTED = ["/dashboard", "/invoices", "/clients", "/analytics", "/settings"];

export function middleware(request: NextRequest): NextResponse {
  const pb = new PocketBase(process.env.NEXT_PUBLIC_PB_URL!);

  try {
    const raw = request.cookies.get("pb_auth")?.value;
    if (raw) {
      const { token, model } = JSON.parse(raw);
      pb.authStore.save(token, model);
    }
  } catch { /* stay unauthenticated */ }

  const isValid   = pb.authStore.isValid;
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );

  if (!isValid && isProtected) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }
  if (isValid && pathname === "/auth") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/webhooks).*)"],
};
