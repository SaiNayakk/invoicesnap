import PocketBase from "pocketbase";
import { cookies } from "next/headers";

/**
 * Server-side PocketBase client.
 * Reads the pb_auth cookie and loads the auth state so
 * pb.authStore.isValid / pb.authStore.model work in API routes.
 */
export async function createPBClient(): Promise<PocketBase> {
  const pb = new PocketBase(process.env.NEXT_PUBLIC_PB_URL!);
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get("pb_auth")?.value;
    if (raw) {
      const { token, model } = JSON.parse(raw);
      pb.authStore.save(token, model);
    }
  } catch {
    /* malformed cookie — stay unauthenticated */
  }
  return pb;
}

/**
 * Server-side PocketBase client authenticated as a superuser.
 * Use only in trusted server contexts (webhooks, background tasks).
 */
export async function createPBAdminClient(): Promise<PocketBase> {
  const pb = new PocketBase(process.env.NEXT_PUBLIC_PB_URL!);
  await pb.collection("_superusers").authWithPassword(
    process.env.PB_ADMIN_EMAIL!,
    process.env.PB_ADMIN_PASSWORD!,
  );
  return pb;
}
