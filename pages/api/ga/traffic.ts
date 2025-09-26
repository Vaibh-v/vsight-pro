// pages/api/ga/traffic.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { InputRangeSchema } from "@/lib/google";
import { getTrafficSeries } from "@/lib/integrations/ga";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();
  try {
    const propertyId = String(req.query.propertyId ?? "").trim();
    const range = InputRangeSchema.parse({ start: req.query.start, end: req.query.end });
    if (!propertyId) return res.status(400).json({ error: "Missing propertyId" });
    const { points, total } = await getTrafficSeries(propertyId, range);
    res.status(200).json({ points, total });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "Traffic fetch failed" });
  }
}
