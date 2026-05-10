import { NextRequest, NextResponse } from "next/server";
import PocketBase from "pocketbase";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, business_name } = await req.json();

    const pb = new PocketBase(process.env.NEXT_PUBLIC_PB_URL!);

    await pb.collection("users").create({
      email,
      password,
      passwordConfirm: password,
      name: name ?? email.split("@")[0],
      business_name: business_name ?? "",
      plan: "free",
      invoice_counter: 0,
      invoice_prefix: "INV",
    });

    // Auto sign-in after registration
    const authData = await pb.collection("users").authWithPassword(email, password);

    const response = NextResponse.json({ user: authData.record }, { status: 201 });
    response.cookies.set("pb_auth", JSON.stringify({ token: authData.token, model: authData.record }), {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      path:     "/",
      maxAge:   60 * 60 * 24 * 30,
    });
    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Registration failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
