// pages/api/ga/traffic.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getTrafficSeries } from "@/lib/integrations/ga";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { propertyId, start, end } = req.query;

    if (!propertyId || !start || !end) {
      return res.status(400).json({ error: "Missing propertyId/start/end" });
    }

    const data = await getTrafficSeries(
      req,
      String(propertyId),
      { start: String(start), end: String(end) }
    );

    return res.status(200).json({
      points: data.points,            // [{ date, sessions }]
      totalSessions: data.total,      // number
    });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "GA4 traffic failed" });
  }
}
