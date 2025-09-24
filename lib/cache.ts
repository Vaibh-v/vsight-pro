// Thin wrapper in case you wire Vercel KV later. For now, falls back to in-memory Map on dev.
const mem = new Map<string, { value: any; expires: number }>();

export async function kvGet<T>(key: string): Promise<T | null> {
  const v = mem.get(key);
  if (!v) return null;
  if (Date.now() > v.expires) {
    mem.delete(key);
    return null;
  }
  return v.value as T;
}
export async function kvSet<T>(key: string, value: T, ttlSeconds: number) {
  mem.set(key, { value, expires: Date.now() + ttlSeconds * 1000 });
}
