import type { NextApiRequest, NextApiResponse } from "next";
import { getAccessTokenOrThrow, ga4SessionsTimeseries } from "@/lib/google";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();
  const { propertyId, start, end } = req.query;
  if (!propertyId || !start || !end) {
    return res.status(400).json({ error: "Missing propertyId/start/end" });
  }
  try {
    const token = await getAccessTokenOrThrow(req);
    const { points, totalSessions } = await ga4SessionsTimeseries({
      token,
      propertyId: String(propertyId),
      start: String(start),
      end: String(end)
    });
    res.status(200).json({ points, totalSessions });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "GA4 traffic failed" });
  }
}
