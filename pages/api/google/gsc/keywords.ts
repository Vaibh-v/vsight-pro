import type { NextApiRequest, NextApiResponse } from "next";
import { getAccessTokenOrThrow, gscQuery, InputRangeSchema } from "@/lib/google";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();
  try {
    const token = await getAccessTokenOrThrow(req);
    const { start, end } = InputRangeSchema.parse(req.query);
    const siteUrl = String(req.query.siteUrl || "");
    const country = req.query.country ? String(req.query.country) : undefined;
    const page = req.query.page ? String(req.query.page) : undefined;

    if (!siteUrl) return res.status(400).json({ error: "Missing siteUrl" });

    const { rows } = await gscQuery({ token, siteUrl, start, end, country, page });
    res.status(200).json({ rows });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "GSC keywords fetch failed" });
  }
}
