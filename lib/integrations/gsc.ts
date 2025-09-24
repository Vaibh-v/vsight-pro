// /lib/integrations/gsc.ts
// Fetch-based Search Console helpers (no 'googleapis' or 'google-auth-library')

import { getAccessTokenOrThrow, gscQuery, listGscSites } from "@/lib/google";
import type { DateRange, GscKeywordRow } from "@/lib/contracts";

// Keep a minimal Country + buckets type to avoid coupling with other files
export type Country = "ALL" | string;

export type RankBuckets = {
  top3: number;
  top10: number;
  top50: number;
};

export type KeywordPoint = {
  date: string;
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;       // 0..1
  position: number;  // avg position
  page?: string;
  country?: string;
};

export type PagePoint = {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

// List verified sites for the current Google user
export async function getSites(): Promise<{ siteUrl: string; permission: string }[]> {
  const token = await getAccessTokenOrThrow();
  return await listGscSites(token);
}

// Fetch keyword rows for a site and date range, optionally filtered by country/page
export async function getKeywords(params: {
  siteUrl: string;
  range: DateRange;
  country?: Country;   // 'ALL' or ISO code
  pagePath?: string;   // optional page filter
}): Promise<KeywordPoint[]> {
  const token = await getAccessTokenOrThrow();
  const rows: GscKeywordRow[] = await gscQuery({
    token,
    siteUrl: params.siteUrl,
    start: params.range.start,
    end: params.range.end,
    country: params.country ?? "ALL",
    pagePath: params.pagePath,
  });

  // Normalize to KeywordPoint
  return rows.map(r => ({
    date: r.date,
    query: r.query,
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: r.ctr,
    position: r.position,
    page: r.page,
    country: r.country,
  }));
}

// Aggregate page-level stats (optional helper; safe to keep)
export function toPagePoints(rows: KeywordPoint[]): PagePoint[] {
  const map = new Map<string, { clicks: number; impressions: number; ctrSum: number; posSum: number; n: number }>();
  for (const r of rows) {
    const key = r.page || "(none)";
    const cur = map.get(key) ?? { clicks: 0, impressions: 0, ctrSum: 0, posSum: 0, n: 0 };
    cur.clicks += r.clicks;
    cur.impressions += r.impressions;
    cur.ctrSum += r.ctr;
    cur.posSum += r.position;
    cur.n += 1;
    map.set(key, cur);
  }
  return Array.from(map.entries()).map(([page, v]) => ({
    page,
    clicks: v.clicks,
    impressions: v.impressions,
    ctr: v.n ? v.ctrSum / v.n : 0,
    position: v.n ? v.posSum / v.n : 0,
  }));
}

// Compute Top3/Top10/Top50 coverage from the latest position per {query,page,country}
export function computeCoverage(rows: KeywordPoint[]): RankBuckets {
  // Keep latest occurrence by (query|page|country)
  const latest = new Map<string, KeywordPoint>();
  for (const r of rows) {
    const key = [r.query, r.page ?? "", r.country ?? "ALL"].join("|");
    latest.set(key, r); // later rows overwrite earlier ones
  }

  let top3 = 0, top10 = 0, top50 = 0;
  for (const r of latest.values()) {
    const pos = Number(r.position ?? 0);
    if (pos <= 50) top50++;
    if (pos <= 10) top10++;
    if (pos <= 3)  top3++;
  }
  return { top3, top10, top50 };
}
