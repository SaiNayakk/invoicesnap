import PocketBase from "pocketbase";
import { cookies } from "next/headers";

export async function createPBClient(): Promise<PocketBase> {
  const pbUrl = process.env.PB_URL || process.env.NEXT_PUBLIC_PB_URL!;
  const pb = new PocketBase(pbUrl);
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get("pb_auth")?.value;
    if (raw) {
      const { token, model } = JSON.parse(raw);
      pb.authStore.save(token, model);
    }
  } catch { /* malformed cookie */ }
  return pb;
}

// One superuser session per server process, refreshed shortly before it expires.
// Re-authenticating on every request added a round trip and hammered the auth endpoint.
let admin: PocketBase | null = null;
let adminAuth: Promise<void> | null = null;

export async function createPBAdminClient(): Promise<PocketBase> {
  if (admin && admin.authStore.isValid && !expiresSoon(admin.authStore.token)) return admin;
  if (!adminAuth) {
    const pbUrl = process.env.PB_URL || process.env.NEXT_PUBLIC_PB_URL!;
    const pb = new PocketBase(pbUrl);
    pb.autoCancellation(false);
    adminAuth = pb
      .collection("_superusers")
      .authWithPassword(process.env.PB_ADMIN_EMAIL!, process.env.PB_ADMIN_PASSWORD!)
      .then(() => { admin = pb; })
      .finally(() => { adminAuth = null; });
  }
  await adminAuth;
  return admin!;
}

function expiresSoon(token: string): boolean {
  try {
    const { exp } = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
    return exp * 1000 - Date.now() < 5 * 60 * 1000;
  } catch {
    return true;
  }
}
