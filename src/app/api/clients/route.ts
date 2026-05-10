import { NextRequest, NextResponse } from "next/server";
import { createPBClient } from "@/lib/pb/server";

export async function GET() {
  try {
    const pb = await createPBClient();
    if (!pb.authStore.isValid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = pb.authStore.model!.id as string;

    const records = await pb.collection("clients").getFullList({
      filter: `user = "${userId}"`,
      sort:   "name",
    });

    return NextResponse.json({ clients: records });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const pb = await createPBClient();
    if (!pb.authStore.isValid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = pb.authStore.model!.id as string;

    const body = await req.json();
    const record = await pb.collection("clients").create({ ...body, user: userId });

    return NextResponse.json({ client: record }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
