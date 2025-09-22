import type { NextApiRequest, NextApiResponse } from "next";
import { getAccessToken, gscQuery } from "@/lib/google";

// returns top queries over a date range (GLOBAL “ALL” country)
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { siteUrl, start, end, rowLimit = "25" } = req.query;
    if (!siteUrl || !start || !end) {
      return res.status(400).json({ error: "Missing siteUrl/start/end" });
    }
    const accessToken = await getAccessToken(req);
    const data = await gscQuery(String(accessToken), String(siteUrl), {
      startDate: String(start),
      endDate: String(end),
      dimensions: ["query", "date", "country"],
      rowLimit: Number(rowLimit),
      aggregationType: "byProperty",
      // You can add dimensionFilter if you later want regional filtering
    });

    // flatten rows to match your UI
    const rows =
      data.rows?.map((r: any) => {
        const [query, date, country] = r.keys ?? [];
        return {
          date,
          query,
          clicks: r.clicks ?? 0,
          impressions: r.impressions ?? 0,
          ctr: r.ctr ?? 0,
          position: r.position ?? 0,
          country: country ?? "ALL",
        };
      }) ?? [];

    res.status(200).json({ rows });
  } catch (e: any) {
    res.status(400).json({ error: e?.message ?? "GSC keywords failed" });
  }
}
