import type { NextRequest } from "next/server";

/** Fixed-window, in-memory limiter. Good enough for one Node process behind a tunnel. */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 10_000) {
      for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
    }
    return true;
  }
  if (b.count >= limit) return false;
  b.count++;
  return true;
}

/** Behind Cloudflare Tunnel the real client IP is in CF-Connecting-IP. */
export function clientIp(req: NextRequest): string {
  return req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
}
