import type { NextApiRequest, NextApiResponse } from "next";

// Accept secret via Authorization: Bearer <CRON_SECRET> OR ?secret=<CRON_SECRET>
function checkSecret(req: NextApiRequest) {
  const header = req.headers.authorization; // "Bearer <secret>"
  const bearer = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  const fromQuery = (req.query.secret as string | undefined)?.trim();
  const expected = process.env.CRON_SECRET;

  const ok = !!expected && (bearer === expected || fromQuery === expected);
  if (!ok) {
    const e: any = new Error("Forbidden");
    e.status = 403;
    throw e;
  }
}

/**
 * Daily snapshot job (stub).
 * In v1 this just verifies auth and returns today's date.
 * You can later expand to:
 *  - iterate users & connections
 *  - call GA4/GSC/GBP fetchers
 *  - write Snapshot rows via Prisma
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "GET" && req.method !== "POST") {
      return res.status(405).end();
    }

    checkSecret(req);

    // TODO: implement pulling & persistence.
    const todayUtc = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    return res.status(200).json({ ok: true, date: todayUtc });
  } catch (e: any) {
    return res.status(e?.status || 500).json({ error: e?.message || "Job failed" });
  }
}
