import { NextRequest, NextResponse } from "next/server";
import PocketBase from "pocketbase";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const pb = new PocketBase(process.env.NEXT_PUBLIC_PB_URL!);
    const authData = await pb.collection("users").authWithPassword(email, password);

    const response = NextResponse.json({ user: authData.record });
    response.cookies.set("pb_auth", JSON.stringify({ token: authData.token, model: authData.record }), {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      path:     "/",
      maxAge:   60 * 60 * 24 * 30, // 30 days
    });
    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid credentials";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
