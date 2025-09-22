// pages/api/google/ga4/properties.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { gaListProperties } from "@/lib/google";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const properties = await gaListProperties(req); // pass req, not token string
    res.status(200).json({ properties });
  } catch (e: any) {
    res.status(400).json({ error: e?.message || "Failed to list GA4 properties" });
  }
}
