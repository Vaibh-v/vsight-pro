// pages/api/gsc/sites.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { listGscSites } from "@/lib/integrations/gsc";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const sites = await listGscSites(req);
    const items = sites.map((s) => ({ label: s.siteUrl, value: s.siteUrl }));
    res.status(200).json({ items });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "Failed to list GSC sites" });
  }
}
