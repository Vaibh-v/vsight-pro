import type { NextApiRequest, NextApiResponse } from "next";
import { listGA4Properties } from "@/lib/google";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const items = await listGA4Properties(req);
    res.status(200).json({ items });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "Failed to list GA4 properties" });
  }
}
