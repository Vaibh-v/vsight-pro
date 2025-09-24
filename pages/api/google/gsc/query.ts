import type { NextApiRequest, NextApiResponse } from "next";
import { getAccessTokenOrThrow, gscQuery, InputRangeSchema } from "@/lib/google";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  try {
    const { siteUrl, start, end, country = "ALL", page } = req.query as Record<string, string | undefined>;
    if (!siteUrl || !start || !end) {
      return res.status(400).json({ error: "Missing siteUrl/start/end" });
    }

    // validate YYYY-MM-DD
    InputRangeSchema.parse({ start, end });

    const token = await getAccessTokenOrThrow();

    const rows = await gscQuery({
      token,
      siteUrl: String(siteUrl),
      start: String(start),
      end: String(end),
      country: country ? String(country) : "ALL",
      pagePath: page ? String(page) : undefined,
    });

    return res.status(200).json({ rows });
  } catch (e: any) {
    return res.status(400).json({ error: e?.message ?? "GSC query failed" });
  }
}
