import type { NextApiRequest, NextApiResponse } from "next";
import { getAccessTokenOrThrow, gbpInsights, InputRangeSchema } from "@/lib/google";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();
  try {
    const token = await getAccessTokenOrThrow(req);
    const { start, end } = InputRangeSchema.parse(req.query);
    const locationId = String(req.query.locationId || "");

    if (!locationId) return res.status(400).json({ error: "Missing locationId" });

    const { rows } = await gbpInsights({ token, locationId, start, end });
    res.status(200).json({ rows });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "GBP insights fetch failed" });
  }
}
