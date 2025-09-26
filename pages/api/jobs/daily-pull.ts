import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const header = req.headers.authorization;
  const bearer = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  const secret = (req.query.secret as string | undefined)?.trim() || bearer;
  if (!secret || secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: "Invalid or missing secret" });
  }
  // No-op for MVP. Later: iterate user connections and persist snapshots.
  return res.status(200).json({ ok: true });
}
