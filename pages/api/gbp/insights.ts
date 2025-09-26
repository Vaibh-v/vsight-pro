import type { NextApiRequest, NextApiResponse } from "next";
import { gbpInsights } from "@/lib/google";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();
  try {
    const data = await gbpInsights(); // placeholder empty
    res.status(200).json(data);
  } catch (e: any) {
    res.status(500).json({ error: e?.message ?? "GBP insights failed" });
  }
}
