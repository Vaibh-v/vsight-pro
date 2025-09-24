import type { NextApiRequest, NextApiResponse } from "next";
import { getAccessToken, gscListSites } from "@/lib/google";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const token = await getAccessToken(req);
    if (!token) return res.status(401).json({ error: "No Google access token" });
    const siteEntries = await gscListSites(token);
    res.status(200).json({ siteEntries });
  } catch (e: any) {
    res.status(400).json({ error: e?.message ?? "Failed to list GSC sites" });
  }
}
