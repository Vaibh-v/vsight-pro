// pages/api/google/gsc/keywords.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getAccessToken } from "@/lib/google";

/**
 * Returns Search Console query rows (dimension: "query") for a given site & date range.
 * Query params:
 *   - siteUrl: string (required) e.g. https://example.com/
 *   - start:   YYYY-MM-DD (required)
 *   - end:     YYYY-MM-DD (required)
 *   - rowLimit?: number (default 250)
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { siteUrl, start, end, rowLimit } = req.query;

    if (!siteUrl || !start || !end) {
      return res.status(400).json({ error: "Missing siteUrl/start/end" });
    }

    const accessToken = await getAccessToken(req);
    if (!accessToken) {
      return res.status(401).json({ error: "No Google access token" });
    }

    const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(
      String(siteUrl)
    )}/searchAnalytics/query`;

    const body = {
      startDate: String(start),
      endDate: String(end),
      dimensions: ["query"],
      rowLimit: rowLimit ? Number(rowLimit) : 250,
      // You can add filters/aggregation here later if needed
    };

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return res
        .status(resp.status)
        .json({ error: "GSC query failed", details: text });
    }

    const data = await resp.json();
    // data = { rows?: Array<{ keys: string[]; clicks:number; impressions:number; ctr:number; position:number }> }
    return res.status(200).json({ rows: data.rows ?? [] });
  } catch (err: any) {
    return res
      .status(500)
      .json({ error: "Unexpected server error", details: err?.message });
  }
}
