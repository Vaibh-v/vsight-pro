import type { NextApiRequest, NextApiResponse } from "next";
import { getAccessTokenOrThrow, listGscSites } from "@/lib/google";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();
  try {
    const token = await getAccessTokenOrThrow(req);
    const items = await listGscSites(token);
    res.status(200).json({ items });
  } catch (e: any) {
    res.status(401).json({ error: e?.message ?? "Unable to list GSC sites" });
  }
}
