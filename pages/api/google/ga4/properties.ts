// pages/api/google/ga4/properties.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getAccessToken, gaListProperties } from "@/lib/google";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const accessToken = await getAccessToken(req);
    if (!accessToken) return res.status(401).json({ error: "No Google token" });

    const properties = await gaListProperties(accessToken);
    res.status(200).json({ properties });
  } catch (e: any) {
    res.status(400).json({ error: e?.message || "Failed to list GA4 properties" });
  }
}
