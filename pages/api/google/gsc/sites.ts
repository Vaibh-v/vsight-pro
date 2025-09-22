// pages/api/google/gsc/sites.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getAccessToken, gscListSites } from "@/lib/google";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const accessToken = await getAccessToken(req);
    if (!accessToken) return res.status(401).json({ error: "No Google token" });

    const sites = await gscListSites(accessToken);
    res.status(200).json({ sites });
  } catch (e: any) {
    res.status(400).json({ error: e?.message || "Failed to list GSC sites" });
  }
}
