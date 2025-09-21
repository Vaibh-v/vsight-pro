import type { NextApiRequest, NextApiResponse } from "next";
import { gbpDriver } from "@/lib/integrations/gbp";
import { requireGoogleAccessToken } from "@/lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const accessToken = await requireGoogleAccessToken(req);
    const { start, end, locationId } = req.query as { start: string; end: string; locationId?: string };
    if (!start || !end) return res.status(400).json({ error: "start & end required" });
    const data = await gbpDriver(accessToken).insights({ start, end }, locationId);
    res.status(200).json({ rows: data });
  } catch (e: any) {
    res.status(400).json({ error: e?.message || "GBP insights failed" });
  }
}
