import type { NextApiRequest, NextApiResponse } from "next";
import { getAccessTokenOrThrow, listGA4Properties } from "@/lib/google";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();
  try {
    const token = await getAccessTokenOrThrow(req);
    const items = await listGA4Properties(token);
    res.status(200).json({ items });
  } catch (e: any) {
    res
      .status(500)
      .json({ error: e?.message ?? "Failed to list GA4 properties" });
  }
}
