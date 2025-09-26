// lib/integrations/gsc.ts
import type { NextApiRequest } from "next";
import type { DateRange, GscSite, GscKeywordRow } from "@/lib/google";
import {
  getAccessTokenOrThrow,
  gscListSites as _listSites,
  gscQueryKeywords as _queryKeywords,
} from "@/lib/google";

export async function listGscSites(req: NextApiRequest): Promise<GscSite[]> {
  const token = getAccessTokenOrThrow(req);
  return _listSites(token);
}

export async function queryGscKeywords(
  req: NextApiRequest,
  minImpressions: number = 10
): Promise<GscKeywordRow[]> {
  const token = getAccessTokenOrThrow(req);
  const siteUrl = String(req.query.siteUrl ?? "").trim();
  const start = String(req.query.start ?? "").trim();
  const end = String(req.query.end ?? "").trim();
  if (!siteUrl) throw new Error("Missing siteUrl");
  const range: DateRange = { start, end };
  return _queryKeywords({ token, siteUrl, range, minImpressions });
}
