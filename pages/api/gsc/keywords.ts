import type { NextApiRequest, NextApiResponse } from "next";
import { queryGscKeywords } from "@/lib/integrations/gsc";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  try {
    const siteUrl = String(req.query.siteUrl ?? "");
    const start = String(req.query.start ?? "");
    const end = String(req.query.end ?? "");

    if (!siteUrl || !start || !end) {
      return res.status(400).json({ error: "Missing siteUrl/start/end" });
    }

    const data = await queryGscKeywords(req, siteUrl, { start, end });
    res.status(200).json(data);
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "GSC keywords fetch failed" });
  }
}
