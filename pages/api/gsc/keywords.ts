import type { NextApiRequest, NextApiResponse } from "next";
import { queryGscKeywords } from "@/lib/integrations/gsc";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const data = await queryGscKeywords(req);
    res.status(200).json(data);
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "GSC keywords fetch failed" });
  }
}
