import type { NextApiRequest } from "next";
import type { DateRange, GscKeywordRow } from "@/lib/google";
import { gscListSites, gscQueryKeywords } from "@/lib/google";

export type GscSite = { siteUrl: string; permissionLevel?: string };

export async function listGscSites(req: NextApiRequest): Promise<GscSite[]> {
  return gscListSites(req);
}

export async function queryGscKeywordsAdapter(
  req: NextApiRequest,
  siteUrl: string,
  range: DateRange
): Promise<{ rows: GscKeywordRow[] }> {
  return gscQueryKeywords(req, siteUrl, range);
}

// Back-compat name so existing imports like `gscQueryKeywords` keep working.
export { queryGscKeywordsAdapter as queryGscKeywords };
