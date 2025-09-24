import type { NextApiRequest, NextApiResponse } from "next";
import { getAccessTokenOrThrow, gscQuery, InputRangeSchema } from "@/lib/google";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  try {
    const token = await getAccessTokenOrThrow();
    const { siteUrl, start, end, country = "ALL", page } = req.query as Record<string, string>;
    if (!siteUrl) return res.status(400).json({ error: "siteUrl is required" });
    InputRangeSchema.parse({ start, end });

    const rows = await gscQuery({
      token,
      siteUrl,
      start,
      end,
      country,
      pagePath: page,
    });

    res.status(200).json({ rows });
  } catch (e: any) {
    res.status(e?.status || 500).json({ error: e?.message || "GSC keywords failed" });
  }
}
