import type { NextApiRequest, NextApiResponse } from "next";
import { getAccessTokenOrThrow, gbpInsights, InputRangeSchema } from "@/lib/google";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();
  try {
    const token = await getAccessTokenOrThrow(req);

    const { locationName, start, end } = req.query as { locationName?: string; start?: string; end?: string };
    if (!locationName) return res.status(400).json({ error: "Missing locationName" });

    const parse = InputRangeSchema.safeParse({ start, end });
    if (!parse.success) return res.status(400).json({ error: "Invalid start/end" });

    const data = await gbpInsights(token, { locationName, range: parse.data });
    res.status(200).json(data);
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "GBP insights failed" });
  }
}
