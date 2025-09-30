import type { NextApiRequest, NextApiResponse } from "next";
import { assertCronSecret } from "@/lib/jobs/cron";

/**
 * Daily job placeholder: pull GA/GSC/GBP and cache/process.
 * Protect with CRON_SECRET.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    assertCronSecret(req.headers as any);
  } catch (e: any) {
    return res.status(401).json({ error: e?.message ?? "unauthorized" });
  }

  if (req.method !== "POST") return res.status(405).end();

  // Do light work only (no external deps) to keep builds stable.
  // Wire real fetch+store when DB is introduced.
  res.status(200).json({ ok: true, ranAt: new Date().toISOString() });
}
