import type { NextApiRequest, NextApiResponse } from "next";
import { getAccessToken, ga4ListProperties } from "@/lib/google";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const token = await getAccessToken(req);
    if (!token) return res.status(401).json({ error: "No Google access token" });
    const properties = await ga4ListProperties(token);
    res.status(200).json({ properties });
  } catch (e: any) {
    res.status(400).json({ error: e?.message ?? "Failed to list GA4 properties" });
  }
}
