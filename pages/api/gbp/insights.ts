// pages/api/gbp/insights.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { gbpStubInsights } from "@/lib/google";

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json(gbpStubInsights());
}
