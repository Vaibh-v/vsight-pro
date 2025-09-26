// lib/google.ts
import type { NextApiRequest } from "next";

export type DateRange = { start: string; end: string };
export type Option = { label: string; value: string };

export type GaTrafficPoint = { date: string; value: number };
export type GscSite = { siteUrl: string; permissionLevel?: string };
export type GscKeywordRow = {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

export const InputRangeSchema = {
  parse(input: any): DateRange {
    const start = String(input?.start ?? "").trim();
    const end = String(input?.end ?? "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
      throw new Error("Invalid date range. Use YYYY-MM-DD.");
    }
    return { start, end };
  },
};

export function getAccessTokenOrThrow(req: NextApiRequest): string {
  const auth = req.headers.authorization;
  if (auth?.toLowerCase().startsWith("bearer ")) {
    const t = auth.slice(7).trim();
    if (t) return t;
  }
  const headerToken = (req.headers["x-oauth-token"] as string | undefined)?.trim();
  if (headerToken) return headerToken;

  const cookie = req.headers.cookie ?? "";
  const m = cookie.match(/(?:^|;\s*)access_token=([^;]+)/);
  if (m?.[1]) return decodeURIComponent(m[1]);

  throw new Error("Missing OAuth access token");
}

// ---------- GA4 (stubbed to compile cleanly) ----------
export async function listGA4Properties(_token: string): Promise<Option[]> {
  return [];
}
export async function ga4SessionsTimeseries(_opts: {
  token: string;
  propertyId: string;
  range: DateRange;
}): Promise<{ points: GaTrafficPoint[]; totalSessions: number }> {
  return { points: [], totalSessions: 0 };
}

// ---------- GSC (stubbed) ----------
export async function gscListSites(_token: string): Promise<GscSite[]> {
  return [];
}
export async function gscQueryKeywords(_opts: {
  token: string;
  siteUrl: string;
  range: DateRange;
  minImpressions?: number;
}): Promise<GscKeywordRow[]> {
  return [];
}

// ---------- GBP (stubbed) ----------
export async function gbpInsights(_opts: {
  token: string;
  locationId: string;
  range: DateRange;
}): Promise<any> {
  return { metrics: [] };
}
