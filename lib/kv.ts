// Minimal Redis-over-HTTP client (Upstash / Vercel Marketplace Redis).
// Vercel serverless instances don't share memory or /tmp, so anything the
// webhook needs (session payload, fulfillment record) must live here.
// If no Redis env vars are set, every call is a no-op and callers fall back
// to the old in-memory + /tmp behavior (fine for local dev).

const URL_ =
  process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "";
const TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || "";

export const isKvConfigured = !!(URL_ && TOKEN);

async function cmd<T = unknown>(args: (string | number)[]): Promise<T | undefined> {
  if (!isKvConfigured) return undefined;
  try {
    const res = await fetch(URL_, {
      method: "POST",
      headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(args),
      cache: "no-store",
    });
    if (!res.ok) {
      console.warn(`[kv] ${args[0]} failed: HTTP ${res.status}`);
      return undefined;
    }
    const json = (await res.json()) as { result?: T; error?: string };
    if (json.error) {
      console.warn(`[kv] ${args[0]} error: ${json.error}`);
      return undefined;
    }
    return json.result;
  } catch (err) {
    console.warn(`[kv] ${args[0]} threw:`, err);
    return undefined;
  }
}

export async function kvSetJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  await cmd(["SET", key, JSON.stringify(value), "EX", ttlSeconds]);
}

export async function kvGetJson<T>(key: string): Promise<T | undefined> {
  const raw = await cmd<string | null>(["GET", key]);
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

export async function kvDel(key: string): Promise<void> {
  await cmd(["DEL", key]);
}

export async function kvSAdd(key: string, member: string): Promise<void> {
  await cmd(["SADD", key, member]);
}

export async function kvSMembers(key: string): Promise<string[]> {
  return (await cmd<string[]>(["SMEMBERS", key])) ?? [];
}
