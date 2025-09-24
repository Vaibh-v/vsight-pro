import type { NextApiRequest, NextApiResponse } from "next";
import { getAccessTokenOrThrow, ga4SessionsTimeseries, gscQuery } from "@/lib/google";
import { prisma } from "@/lib/prisma";

// Minimal guard; call with /api/jobs/daily-pull?secret=...
function checkSecret(req: NextApiRequest) {
  const ok = req.query.secret && req.query.secret === process.env.CRON_SECRET;
  if (!ok) {
    const e = new Error("Forbidden");
    (e as any).status = 403;
    throw e;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    checkSecret(req);
    const token = await getAccessTokenOrThrow();

    // This is a minimal stub. In a full build:
    // 1) Loop user connections/entities from DB
    // 2) For each, pull yesterday data and write Snapshot rows

    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const start = yesterday.toISOString().slice(0,10);
    const end = start;

    // Example upsert (replace with your real entity loops)
    const user = await prisma.user.findFirst();
    if (!user) return res.status(200).json({ ok: true, info: "No users yet" });

    // ...pull calls here per entity (ga4SessionsTimeseries, gscQuery, gbp later)
    // Write examples:
    // await prisma.snapshot.create({ data: { userId: user.id, date: new Date(start), source: 'GA4', entityId: 'properties/xxx', metric: 'sessions', value: 123 } });

    res.status(200).json({ ok: true, date: start });
  } catch (e: any) {
    res.status(e.status || 500).json({ error: e.message || "Cron failed" });
  }
}
