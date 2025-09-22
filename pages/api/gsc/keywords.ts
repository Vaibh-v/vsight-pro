import type { NextApiRequest, NextApiResponse } from "next";
import { getAccessToken } from "@/lib/google";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { siteUrl, start, end } = (req.method === "POST" ? req.body : req.query) as any;
    if (!siteUrl || !start || !end)
      return res.status(400).json({ error: "Missing siteUrl/start/end" });

    const token = await getAccessToken(req);
    const url = "https://www.googleapis.com/webmasters/v3/searchAnalytics/query";
    const body = {
      startDate: String(start),
      endDate: String(end),
      dimensions: ["query"],
      rowLimit: 50,
    };

    const resp = await fetch(`${url}?siteUrl=${encodeURIComponent(String(siteUrl))}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const t = await resp.text();
      throw new Error(t);
    }
    const data = await resp.json();

    res.status(200).json({ rows: data.rows ?? [] });
  } catch (e: any) {
    res
      .status(400)
      .json({ error: e?.message || "GSC searchAnalytics.query failed" });
  }
}
