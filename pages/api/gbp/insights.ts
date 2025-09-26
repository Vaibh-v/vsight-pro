// pages/api/gbp/insights.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getAccessTokenOrThrow, InputRangeSchema, gbpInsights } from "@/lib/google";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();
  try {
    const token = getAccessTokenOrThrow(req);
    const locationId = String(req.query.locationId ?? "").trim();
    const range = InputRangeSchema.parse({ start: req.query.start, end: req.query.end });
    if (!locationId) return res.status(400).json({ error: "Missing locationId" });
    const data = await gbpInsights({ token, locationId, range });
    res.status(200).json({ data });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "GBP insights failed" });
  }
}
