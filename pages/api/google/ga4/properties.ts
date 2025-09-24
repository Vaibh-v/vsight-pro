import type { NextApiRequest, NextApiResponse } from "next";
import { getAccessTokenOrThrow, listGA4Properties } from "@/lib/google";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const token = await getAccessTokenOrThrow();
    const items = await listGA4Properties(token);
    res.status(200).json({ items });
  } catch (e: any) {
    res.status(e.status || 500).json({ error: e.message || "Failed to list GA4 properties" });
  }
}
