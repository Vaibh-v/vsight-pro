// pages/api/google/ga4/properties.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { listGA4Properties } from "@/lib/google";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
    const props = await listGA4Properties(req);
    // UI expects: [{ id, name }]
    return res.status(200).json(props);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "Failed to list GA4 properties" });
  }
}
