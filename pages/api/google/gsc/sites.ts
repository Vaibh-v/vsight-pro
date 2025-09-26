// pages/api/google/gsc/sites.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { listGscSites } from "@/lib/google";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
    const sites = await listGscSites(req);
    // UI expects: [{ siteUrl, permissionLevel }]
    return res.status(200).json(sites);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "Failed to list GSC sites" });
  }
}
