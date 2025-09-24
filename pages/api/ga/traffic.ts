import type { NextApiRequest, NextApiResponse } from "next";
import { getAccessToken, gaRunReport } from "@/lib/google";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { propertyId, start, end } = req.query;
    if (!propertyId || !start || !end) {
      return res.status(400).json({ error: "Missing propertyId/start/end" });
    }

    const token = await getAccessToken(req);
    if (!token) return res.status(401).json({ error: "No Google access token" });

    const report = await gaRunReport(token, String(propertyId), {
      dimensions: [{ name: "date" }],
      metrics: [{ name: "sessions" }],
      dateRanges: [{ startDate: String(start), endDate: String(end) }]
    });

    // flatten to a simple series
    const points =
      (report.rows ?? []).map((r: any) => ({
        date: r.dimensionValues?.[0]?.value ?? "",
        sessions: Number(r.metricValues?.[0]?.value ?? 0)
      })) ?? [];

    res.status(200).json({ points });
  } catch (e: any) {
    res.status(400).json({ error: e?.message ?? "GA traffic query failed" });
  }
}
