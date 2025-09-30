/**
 * Cron guard: require Authorization: Bearer <CRON_SECRET>
 */
export function assertCronSecret(headers: Record<string, any>) {
  const header = headers?.authorization || headers?.Authorization;
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) throw new Error("Missing CRON_SECRET env");
  if (!header || typeof header !== "string" || !header.startsWith("Bearer ")) {
    throw new Error("Unauthorized: missing bearer");
  }
  const provided = header.slice(7).trim();
  if (provided !== secret) throw new Error("Unauthorized: bad secret");
}

export async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
