// lib/google.ts
// Centralized, dependency-free Google helpers used by API routes.
// - No 'googleapis' SDK
// - Server-only helpers that read the user's Google OAuth token from NextAuth
// - Safe, minimal "schema" shim so we don't depend on zod

import type { NextApiRequest } from "next";
import { getToken } from "next-auth/jwt";

// ---------- Shared types ----------
export type DateRange = { start: string; end: string };

// Schema shim compatible with `.parse({ start, end })`
export const InputRangeSchema = {
  parse(input: any): DateRange {
    const start = String(input?.start ?? "").trim();
    const end = String(input?.end ?? "").trim();
    if (!start || !end) throw new Error("Missing start/end");
    // Very light validation (YYYY-MM-DD)
    const re = /^\d{4}-\d{2}-\d{2}$/;
    if (!re.test(start) || !re.test(end)) {
      throw new Error("Invalid date format; expected YYYY-MM-DD");
    }
    return { start, end };
  },
};

// ---------- Auth helper ----------
export async function getAccessTokenOrThrow(req: NextApiRequest): Promise<string> {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not set");
  const token = await getToken({ req, secret });
  const accessToken = (token as any)?.accessToken as string | undefined;
  if (!accessToken) throw new Error("No Google access token on session");
  return accessToken;
}

// ---------- GA4 helpers ----------
// Lists GA4 properties visible to the signed-in user by flattening account summaries.
export async function listGA4Properties(req: NextApiRequest): Promise<{ id: string; displayName: string }[]> {
  const token = await getAccessTokenOrThrow(req);

  // Get account summaries, then flatten propertySummaries
  const url = "https://analyticsadmin.googleapis.com/v1beta/accountSummaries?pageSize=200";
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`GA Admin API error (${resp.status}): ${txt}`);
  }
  const json = (await resp.json()) as {
    accountSummaries?: Array<{
      account?: string;
      displayName?: string;
      propertySummaries?: Array<{ property?: string; displayName?: string }>;
    }>;
  };

  const props: { id: string; displayName: string }[] = [];
  for (const acc of json.accountSummaries ?? []) {
    for (const p of acc.propertySummaries ?? []) {
      // property comes like "properties/123456789"
      const id = (p.property ?? "").split("/")[1] ?? "";
      if (id) props.push({ id, displayName: p.displayName ?? id });
    }
  }
  // Deduplicate just in case
  const seen = new Set<string>();
  return props.filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)));
}

// Timeseries of sessions for a GA4 property using the Data API.
export async function ga4SessionsTimeseries(args: {
  token: string;
  propertyId: string;
  range: DateRange;
}): Promise<{ points: { date: string; value: number }[]; totalSessions: number }> {
  const { token, propertyId, range } = args;
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(
    propertyId
  )}:runReport`;

  const body = {
    dateRanges: [{ startDate: range.start, endDate: range.end }],
    metrics: [{ name: "sessions" }],
    dimensions: [{ name: "date" }],
    keepEmptyRows: false,
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`GA4 Data API error (${resp.status}): ${txt}`);
  }

  type Row = { dimensionValues?: { value?: string }[]; metricValues?: { value?: string }[] };
  const json = (await resp.json()) as { rows?: Row[]; totals?: { metricValues?: { value?: string }[] }[] };

  const points =
    (json.rows ?? []).map((r) => ({
      date: (r.dimensionValues?.[0]?.value ?? "") as string,
      value: Number(r.metricValues?.[0]?.value ?? 0),
    })) ?? [];

  const totalSessions = Number(json.totals?.[0]?.metricValues?.[0]?.value ?? 0);

  // GA4 returns date like "20240915" sometimes; normalize to "YYYY-MM-DD" if needed
  const norm = (d: string) => (d.length === 8 ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}` : d);
  const normalized = points.map((p) => ({ date: norm(p.date), value: p.value }));

  return { points: normalized, totalSessions };
}

// ---------- GSC helpers ----------
export type GscSite = { siteUrl: string; permissionLevel?: string };

// Lists sites in the user's Search Console
export async function listGscSites(req: NextApiRequest): Promise<GscSite[]> {
  const token = await getAccessTokenOrThrow(req);
  const url = "https://www.googleapis.com/webmasters/v3/sites/list";
  const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`GSC list sites error (${resp.status}): ${txt}`);
  }
  const json = (await resp.json()) as { siteEntry?: Array<{ siteUrl?: string; permissionLevel?: string }> };
  return (json.siteEntry ?? [])
    .filter((s) => !!s.siteUrl)
    .map((s) => ({ siteUrl: s.siteUrl as string, permissionLevel: s.permissionLevel }));
}

export type GscKeywordRow = {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

// Query Search Console searchanalytics for keyword performance
export async function queryGscKeywords(args: {
  req: NextApiRequest;
  siteUrl: string;
  range: DateRange;
  rowLimit?: number;
}): Promise<{ rows: GscKeywordRow[] }> {
  const { req, siteUrl, range, rowLimit = 250 } = args;
  const token = await getAccessTokenOrThrow(req);

  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;
  const body = {
    startDate: range.start,
    endDate: range.end,
    dimensions: ["query"],
    rowLimit,
    dataState: "final",
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`GSC query error (${resp.status}): ${txt}`);
  }

  const json = (await resp.json()) as {
    rows?: Array<{ keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number }>;
  };

  const rows: GscKeywordRow[] = (json.rows ?? []).map((r) => ({
    query: r.keys?.[0] ?? "",
    clicks: r.clicks ?? 0,
    impressions: r.impressions ?? 0,
    ctr: r.ctr ?? 0,
    position: r.position ?? 0,
  }));

  return { rows };
}
