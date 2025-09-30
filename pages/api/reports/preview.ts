import type { NextApiRequest, NextApiResponse } from "next";
import { InputRangeSchema } from "@/lib/google";
import { buildWeeklyReport } from "@/lib/reports/generator";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  const { start, end, propertyId, siteUrl } = req.query as any;
  const parsed = InputRangeSchema.safeParse({ start, end });
  if (!parsed.success) return res.status(400).json({ error: "invalid range" });

  const tokenHeader = (req.headers?.authorization || req.headers?.Authorization) as string | undefined;
  const token = tokenHeader?.startsWith("Bearer ") ? tokenHeader.slice(7) : undefined;

  const payload = await buildWeeklyReport({
    range: parsed.data,
    propertyId: propertyId || undefined,
    siteUrl: siteUrl || undefined,
    token
  });
  res.status(200).json(payload);
}
