import type { NextApiRequest } from "next";
import {
  getAccessTokenOrThrow,
  // low-level helpers that expect a token string:
  listGscSites as _listGscSites,
  gscQuery as _gscQuery,
} from "@/lib/google";

// Minimal shared types (kept local to avoid importing other app files)
export type DateRange = { start: string; end: string };

export type GscSite = {
  siteUrl: string;
  permissionLevel?: string;
};

export type GscKeywordRow = {
  date?: string;
  query?: string;
  page?: string;
  country?: string;
  clicks: number;
  impressions: number;
  ctr?: number;
  position?: number;
};

/**
 * List GSC sites for the signed-in user.
 * - Derives Google OAuth access token from NextAuth session on the request
 * - Calls the low-level function that requires a token string
 */
export async function listGscSites(req: NextApiRequest): Promise<GscSite[]> {
  const token = await getAccessTokenOrThrow(req);
  return _listGscSites(token);
}

/**
 * Query GSC keyword data.
 * The low-level `_gscQuery` expects:
 *   { token, siteUrl, start, end, country?, page? }
 * This wrapper derives the token from the request and forwards the rest.
 */
export async function queryGscKeywords(
  req: NextApiRequest,
  args: {
    siteUrl: string;
    range: DateRange;
    country?: string; // e.g., "ALL" | "US" | "IN"
    page?: string;    // optional page filter
  }
): Promise<{ rows: GscKeywordRow[] }> {
  const token = await getAccessTokenOrThrow(req);
  const { siteUrl, range, country, page } = args;

  const result = await _gscQuery({
    token,
    siteUrl,
    start: range.start,
    end: range.end,
    country,
    page,
  });

  // Ensure shape is { rows: GscKeywordRow[] }
  return {
    rows: (result?.rows ?? []) as GscKeywordRow[],
  };
}
