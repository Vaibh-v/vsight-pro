import type { NextApiRequest, NextApiResponse } from "next";
import { gaListProperties } from "@/lib/integrations/ga";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const items = await gaListProperties(req);
    res.status(200).json({ items });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "Failed to list GA4 properties" });
  }
}
