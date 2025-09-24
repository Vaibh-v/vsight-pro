import type { NextApiRequest, NextApiResponse } from "next";
import { getAccessToken, gscQueryKeywords } from "@/lib/google";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { siteUrl, start, end, rowLimit } = req.query;
    if (!siteUrl || !start || !end) return res.status(400).json({ error: "Missing siteUrl/start/end" });

    const token = await getAccessToken(req);
    if (!token) return res.status(401).json({ error: "No Google access token" });

    const data = await gscQueryKeywords(
      token,
      String(siteUrl),
      String(start),
      String(end),
      rowLimit ? Number(rowLimit) : 250
    );
    res.status(200).json({ rows: data.rows ?? [] });
  } catch (e: any) {
    res.status(400).json({ error: e?.message ?? "GSC keyword query failed" });
  }
}
