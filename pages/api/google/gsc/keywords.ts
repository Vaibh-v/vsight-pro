import type { NextApiRequest, NextApiResponse } from "next";
import { getAccessTokenOrThrow, gscQueryKeywords } from "@/lib/google";

/**
 * GET /api/google/gsc/keywords?siteUrl=...&start=YYYY-MM-DD&end=YYYY-MM-DD
 * Returns: { rows: Array<{ query: string; clicks: number; impressions: number; ctr: number; position: number }> }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  const { siteUrl, start, end } = req.query;
  if (!siteUrl || !start || !end) {
    return res.status(400).json({ error: "Missing siteUrl/start/end" });
  }

  try {
    const token = await getAccessTokenOrThrow(req);
    const rows = await gscQueryKeywords({
      token,
      siteUrl: String(siteUrl),
      start: String(start),
      end: String(end),
    });
    return res.status(200).json({ rows });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "GSC keywords failed" });
  }
}
