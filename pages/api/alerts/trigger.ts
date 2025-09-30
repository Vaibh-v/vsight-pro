import type { NextApiRequest, NextApiResponse } from "next";
import { assertCronSecret } from "@/lib/jobs/cron";
import { evaluateRules } from "@/lib/alerts/rules";
import { InputRangeSchema } from "@/lib/google";

/**
 * Cron-triggered evaluation endpoint.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    assertCronSecret(req.headers as any);
  } catch (e: any) {
    return res.status(401).json({ error: e?.message ?? "unauthorized" });
  }
  if (req.method !== "POST") return res.status(405).end();

  const { start, end, propertyId, siteUrl } = req.body ?? {};
  const parsed = InputRangeSchema.safeParse({ start, end });
  if (!parsed.success) return res.status(400).json({ error: "invalid range" });

  const result = await evaluateRules({ range: parsed.data, propertyId, siteUrl });
  return res.status(200).json({ ok: true, ...result });
}
