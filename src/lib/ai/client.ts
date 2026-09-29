/**
 * Server-side client for the shared SaiWorks AI service.
 * Never import from client components: it carries the service token.
 */

const BASE = process.env.AI_SERVICE_URL?.replace(/\/$/, "");
const TOKEN = process.env.AI_SERVICE_TOKEN;

export class AIUnavailable extends Error {}

async function call<T>(method: string, path: string, body?: unknown, timeoutMs = 25_000): Promise<T> {
  if (!BASE || !TOKEN) throw new AIUnavailable("AI service not configured");
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN}` },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
  } catch (err) {
    throw new AIUnavailable(err instanceof Error ? err.message : "unreachable");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = new Error((data as { error?: string }).error ?? `AI service ${res.status}`) as Error & { status: number };
    e.status = res.status;
    throw e;
  }
  return data as T;
}

export interface ExtractedItem { description: string; quantity: number; rate: number; flags: string[] }
export interface Extraction {
  client: { name: string; phone: string; email: string };
  items: ExtractedItem[];
  gst_rate: number | null;
  due_in_days: number | null;
  due_date: string | null;
  notes: string;
  transcript: string;
  flags: string[];
  dropped: number;
  refused: boolean;
}

export const ai = {
  upsertTenant: (slug: string, name: string) => call("PUT", `/v1/tenants/${slug}`, { name }),
  deleteTenant: (slug: string) => call("DELETE", `/v1/tenants/${slug}`),
  extract: (slug: string, text: string, image: { mime: string; data: string } | null, endUser: string) =>
    call<Extraction>("POST", "/v1/extract", { tenant: slug, text, image, end_user: endUser }, image ? 45_000 : 25_000),
  compose: (slug: string, facts: string[], tone: "friendly" | "firm" | "final", language: "en" | "hinglish") =>
    call<{ message: string | null; reason: string | null }>("POST", "/v1/compose", { tenant: slug, facts, tone, language }),
  brief: (slug: string, facts: { id: number; text: string }[]) =>
    call<{ bullets: { text: string; facts: number[] }[]; dropped: number }>("POST", "/v1/brief", { tenant: slug, facts }, 40_000),
};
