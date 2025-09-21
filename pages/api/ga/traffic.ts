import type { NextApiRequest, NextApiResponse } from "next";
import { gaDriver } from "@/lib/integrations/ga";
import { requireGoogleAccessToken } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const accessToken = await requireGoogleAccessToken(req);
    const { start, end } = req.query as { start: string; end: string };
    if (!start || !end) return res.status(400).json({ error: "start & end required (YYYY-MM-DD)" });
    const data = await gaDriver(accessToken).traffic({ start, end });
    res.status(200).json({ points: data });
  } catch (e: any) {
    res.status(400).json({ error: e?.message || "GA traffic failed" });
  }
}
