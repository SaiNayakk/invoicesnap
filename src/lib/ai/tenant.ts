import type { Profile } from "@/lib/types";
import { tenantOf } from "@/lib/owner";
import { ai } from "./client";

const g = globalThis as unknown as { __isTenants?: Map<string, string> };
const synced = (g.__isTenants ??= new Map());

/** The AI service needs a tenant (its name is the business name the model writes as). Cheap and idempotent. */
export async function ensureTenant(owner: Profile) {
  const name = owner.business_name || owner.name || "this business";
  if (synced.get(owner.id) === name) return;
  try {
    await ai.upsertTenant(tenantOf(owner.id), name.slice(0, 80));
    synced.set(owner.id, name);
  } catch {
    /* callers fall back to templates */
  }
}
