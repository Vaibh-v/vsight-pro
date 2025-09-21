import type { NextApiRequest, NextApiResponse } from "next";
import { gscDriver } from "@/lib/integrations/gsc";
import { requireGoogleAccessToken } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const accessToken = await requireGoogleAccessToken(req);
    const { start, end, country } = req.query as { start: string; end: string; country?: string };
    if (!start || !end) return res.status(400).json({ error: "start & end required" });
    const data = await gscDriver(accessToken).keywords({ start, end }, (country as any) || "ALL");
    res.status(200).json({ rows: data });
  } catch (e: any) {
    res.status(400).json({ error: e?.message || "GSC keywords failed" });
  }
}
