import type { NextApiRequest, NextApiResponse } from "next";
import { getAccessTokenOrThrow, ga4SessionsTimeseries, InputRangeSchema } from "@/lib/google";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  try {
    const token = await getAccessTokenOrThrow();
    const { propertyId, start, end } = req.query as Record<string, string>;
    if (!propertyId) return res.status(400).json({ error: "propertyId is required" });
    InputRangeSchema.parse({ start, end });

    const data = await ga4SessionsTimeseries({ token, propertyId, start, end });
    res.status(200).json(data);
  } catch (e: any) {
    res.status(e.status || 500).json({ error: e.message || "GA traffic failed" });
  }
}
