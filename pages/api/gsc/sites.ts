import type { NextApiRequest, NextApiResponse } from "next";
import { listGscSites } from "@/lib/integrations/gsc";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const items = await listGscSites(req);
    res.status(200).json({ items });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "Failed to list GSC sites" });
  }
}
