import { cache } from "react";
import { redirect } from "next/navigation";
import { createPBClient } from "@/lib/pb/server";
import type { Profile } from "@/lib/types";

/**
 * The signed-in user's profile, or null.
 *
 * `authStore.isValid` only checks the token's expiry, not its signature.
 * Fetching the user record *with* the token makes PocketBase verify it, so a
 * forged cookie gets nothing. Cached per request.
 */
export const getOwner = cache(async (): Promise<Profile | null> => {
  const pb = await createPBClient();
  const id = pb.authStore.record?.id;
  if (!pb.authStore.isValid || !id) return null;
  try {
    return (await pb.collection("users").getOne(id)) as unknown as Profile;
  } catch {
    return null;
  }
});

export async function requireOwner(): Promise<Profile> {
  const owner = await getOwner();
  if (!owner) redirect("/auth");
  return owner;
}

/** AI-service tenant for a user. PocketBase ids are 15 lowercase alphanumerics, a valid slug as-is. */
export const tenantOf = (userId: string) => `u-${userId}`;
