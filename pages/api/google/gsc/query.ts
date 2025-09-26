import type { NextApiRequest, NextApiResponse } from "next";
import { getAccessTokenOrThrow, gscQuery, InputRangeSchema } from "@/lib/google";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET" && req.method !== "POST") return res.status(405).end();
  try {
    const token = await getAccessTokenOrThrow(req);

    // accept both querystring (GET) and JSON body (POST)
    const source = req.method === "GET" ? req.query : (req.body || {});
    const { start, end } = InputRangeSchema.parse(source);
    const siteUrl = String(source.siteUrl || "");
    const country = source.country ? String(source.country) : undefined;
    const page = source.page ? String(source.page) : undefined;

    if (!siteUrl) return res.status(400).json({ error: "Missing siteUrl" });

    const { rows } = await gscQuery({ token, siteUrl, start, end, country, page });
    res.status(200).json({ rows });
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "GSC query failed" });
  }
}
