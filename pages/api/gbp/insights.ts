import type { NextApiRequest, NextApiResponse } from "next";
import { getAccessTokenOrThrow, gbpInsights, InputRangeSchema } from "@/lib/google";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  try {
    const token = await getAccessTokenOrThrow();
    const { locationId, start, end } = req.query as Record<string, string>;
    if (!locationId) return res.status(400).json({ error: "locationId is required" });
    InputRangeSchema.parse({ start, end });

    const rows = await gbpInsights({ token, locationId, start, end });
    res.status(200).json({ rows });
  } catch (e: any) {
    res.status(e.status || 500).json({ error: e.message || "GBP insights failed" });
  }
}
