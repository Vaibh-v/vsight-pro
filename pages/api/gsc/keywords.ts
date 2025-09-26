import type { NextApiRequest, NextApiResponse } from "next";
import { gscQueryKeywords } from "@/lib/integrations/gsc";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { siteUrl, start, end } = req.query;
    if (!siteUrl || !start || !end) {
      return res.status(400).json({ error: "Missing siteUrl/start/end" });
    }
    const rows = await gscQueryKeywords(req, String(siteUrl), String(start), String(end));
    res.status(200).json({ rows });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "GSC keywords failed" });
  }
}
