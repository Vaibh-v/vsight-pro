import type { NextApiRequest, NextApiResponse } from "next";
import { getAccessTokenOrThrow, ga4SessionsTimeseries, InputRangeSchema } from "@/lib/google";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();
  try {
    const token = await getAccessTokenOrThrow(req);
    const { start, end } = InputRangeSchema.parse(req.query);
    const propertyId = String(req.query.propertyId || "");

    if (!propertyId) {
      return res.status(400).json({ error: "Missing propertyId" });
    }

    const { points, totalSessions } = await ga4SessionsTimeseries({
      token,
      propertyId,
      start,
      end,
    });

    res.status(200).json({ points, totalSessions });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "GA4 traffic fetch failed" });
  }
}
