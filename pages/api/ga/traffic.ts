// pages/api/ga/traffic.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { gaRunReport } from "@/lib/google";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { propertyId, start, end } = req.query;
    if (!propertyId || !start || !end) {
      return res.status(400).json({ error: "Missing propertyId/start/end" });
    }

    const data = await gaRunReport(
      req,
      String(propertyId),
      String(start),
      String(end)
    );

    res.status(200).json(data);
  } catch (e: any) {
    res.status(400).json({ error: e?.message || "GA4 runReport failed" });
  }
}
