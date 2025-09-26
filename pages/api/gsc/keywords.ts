// pages/api/gsc/keywords.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { queryGscKeywords } from "@/lib/integrations/gsc";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const min = Number(req.query.minImpressions ?? 10) || 10;
    const rows = await queryGscKeywords(req, min);
    res.status(200).json({ rows });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "GSC keywords fetch failed" });
  }
}
