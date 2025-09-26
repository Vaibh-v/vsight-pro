import type { NextApiRequest } from "next";
import { getAccessTokenOrThrow, gscListSites, gscQuery, type DateRange } from "@/lib/google";

export type GscSite = { siteUrl: string; permissionLevel?: string };

/**
 * Lists Search Console verified sites for the current user.
 */
export async function listGscSites(req: NextApiRequest): Promise<GscSite[]> {
  const token = await getAccessTokenOrThrow(req);
  return gscListSites(token);
}

/**
 * Keyword query wrapper. Reads params from req.query:
 * - siteUrl (string)
 * - start (YYYY-MM-DD)
 * - end (YYYY-MM-DD)
 * Optional:
 * - country (2-letter)
 * - page (url), query (keyword), dimensions (array), rowLimit (number)
 */
export async function queryGscKeywords(req: NextApiRequest, overrideRange?: DateRange) {
  const token = await getAccessTokenOrThrow(req);

  const {
    siteUrl,
    start,
    end,
    country,
    page,
    query,
    rowLimit,
  } = req.query as {
    siteUrl?: string;
    start?: string;
    end?: string;
    country?: string;
    page?: string;
    query?: string;
    rowLimit?: string;
  };

  if (!siteUrl) throw new Error("Missing siteUrl");

  const range = overrideRange ?? (start && end ? { start, end } : undefined);
  if (!range) throw new Error("Missing start/end");

  const params = {
    siteUrl,
    range,
    country: country || undefined,
    page: page || undefined,
    query: query || undefined,
    rowLimit: rowLimit ? Number(rowLimit) : undefined,
  };

  return gscQuery(token, params);
}
