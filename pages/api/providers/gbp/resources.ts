import type { NextApiRequest, NextApiResponse } from "next";
import { listResources } from "@/lib/providers/gbp";

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const items = await listResources({});
    res.status(200).json({ items });
  } catch (e: any) {
    res.status(200).json({ items: [] });
  }
}
