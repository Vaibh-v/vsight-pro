import type { NextApiRequest, NextApiResponse } from "next";

function checkSecret(req: NextApiRequest) {
  const header = req.headers.authorization; // "Bearer <secret>"
  const bearer = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  const fromQuery = (req.query.secret as string | undefined)?.trim();
  const secret = process.env.CRON_SECRET;
  if (!secret) throw new Error("CRON_SECRET not set");
  const ok = bearer === secret || fromQuery === secret;
  if (!ok) throw new Error("Unauthorized");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    checkSecret(req);
    // Later: pull GA4/GSC/GBP and store snapshots.
    res.status(200).json({ ok: true });
  } catch (e: any) {
    res.status(401).json({ error: e?.message ?? "Unauthorized" });
  }
}
