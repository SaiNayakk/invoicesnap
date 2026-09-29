import type { NextResponse } from "next/server";

/** Same cookie the login route sets, so a demo visitor uses the real, unmodified dashboard. */
export function setAuthCookie(res: NextResponse, token: string, record: unknown, maxAgeSeconds = 60 * 60 * 24 * 30) {
  res.cookies.set("pb_auth", JSON.stringify({ token, model: record }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  });
}
