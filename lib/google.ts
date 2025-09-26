// lib/google.ts
// Lightweight Google helpers using fetch + NextAuth JWT. No 'googleapis' package needed.

import type { NextApiRequest } from "next";
import { getToken } from "next-auth/jwt";

/* ===========================
   Shared tiny types
=========================== */

export type DateRange = { start: string; end: string };

export type Ga4Property = { id: string; name: string };
export type GscSite = { siteUrl: string; permissionLevel?: string };

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

export type TrafficPoint = { date: string; sessions: number };

/* ======================================================
   Minimal "schema" to avoid adding zod to your build
   - keeps existing imports like `InputRangeSchema.parse(...)` working
====================================================== */
export const InputRangeSchema = {
  parse(q: any): { start: string; end: string } {
    if (!q || !q.start || !q.end) {
      throw new Error("Missing 'start' or 'end'");
    }
    const start = String(q.start);
    const end = String(q.end);
    // naive guard (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
      throw new Error("Dates must be YYYY-MM-DD");
    }
    return { start, end };
  },
};

/* ===========================
   Auth helper
=========================== */

export async function getAccessTokenOrThrow(req: NextApiRequest): Promise<string> {
  // 1) Honor explicit Bearer header (useful for testing/curl)
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice(7).trim();
    if (token) return token;
  }

  // 2) Pull NextAuth JWT (requires NEXTAUTH_SECRET set in env)
  const jwt = await getToken({ req });
  const accessToken = (jwt as any)?.accessToken as string | undefined;

  if (!accessToken) {
    throw new Error("Not authenticated with Google (no accessToken). Sign in again.");
  }
  return accessToken;
}

/* ===========================
   Low-level fetch wrapper
=========================== */

async function gfetch<T>(url: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Google API ${res.status}: ${body || res.statusText}`);
  }
  return (await res.json()) as T;
}

/* ===========================
   GA4 — list properties
   Endpoint: account summaries (v1beta)
   https://analyticsadmin.googleapis.com/v1beta/accountSummaries
   Scope: https://www.googleapis.com/auth/analytics.readonly
=========================== */

export async function listGA4Properties(token: string): Promise<Ga4Property[]> {
  type AccountSummariesResp = {
    accountSummaries?: Array<{
      name: string; // accounts/1234
      displayName?: string;
      propertySummaries?: Array<{
        property: string; // properties/XXXXXX
        displayName?: string;
      }>;
    }>;
    nextPageToken?: string;
  };

  const items: Ga4Property[] = [];
  let pageToken: string | undefined = undefined;

  do {
    const url = new URL("https://analyticsadmin.googleapis.com/v1beta/accountSummaries");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const data = await gfetch<AccountSummariesResp>(url.toString(), token);
    data.accountSummaries?.forEach((acct) => {
      acct.propertySummaries?.forEach((p) => {
        const id = p.property.replace("properties/", "");
        items.push({ id, name: p.displayName || id });
      });
    });
    pageToken = data.nextPageToken;
  } while (pageToken);

  // de-dup (just in case)
  const uniq = new Map<string, Ga4Property>();
  for (const it of items) uniq.set(it.id, it);
  return Array.from(uniq.values());
}

/* ===========================
   GA4 — sessions timeseries
   Endpoint: runReport (v1beta)
   https://analyticsdata.googleapis.com/v1beta/properties/{pid}:runReport
   Scope: analytics.readonly
=========================== */

export async function ga4SessionsTimeseries(args: {
  token: string;
  propertyId: string;
  start: string;
  end: string;
}): Promise<{ points: TrafficPoint[]; totalSessions: number }> {
  const { token, propertyId, start, end } = args;

  type RunReportResp = {
    rows?: Array<{ dimensionValues?: Array<{ value?: string }>; metricValues?: Array<{ value?: string }> }>;
    totals?: Array<{ metricValues?: Array<{ value?: string }> }>;
  };

  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(
    propertyId
  )}:runReport`;

  const body = {
    dateRanges: [{ startDate: start, endDate: end }],
    dimensions: [{ name: "date" }],
    metrics: [{ name: "sessions" }],
    keepEmptyRows: false,
  };

  const data = await gfetch<RunReportResp>(url, token, { method: "POST", body: JSON.stringify(body) });

  const points: TrafficPoint[] =
    data.rows?.map((r) => ({
      date: r.dimensionValues?.[0]?.value || "",
      sessions: Number(r.metricValues?.[0]?.value || 0),
    })) || [];

  const totalSessions = Number(data.totals?.[0]?.metricValues?.[0]?.value || 0);

  return { points, totalSessions };
}

/* ===========================
   GSC — list sites
   Endpoint: https://www.googleapis.com/webmasters/v3/sites/list
   Scope: webmasters.readonly
=========================== */

export async function listGscSites(token: string): Promise<GscSite[]> {
  type Resp = { siteEntry?: Array<{ siteUrl: string; permissionLevel?: string }> };
  const data = await gfetch<Resp>("https://www.googleapis.com/webmasters/v3/sites/list", token);
  return (data.siteEntry || []).map((s) => ({ siteUrl: s.siteUrl, permissionLevel: s.permissionLevel }));
}

/* ===========================
   GSC — search analytics query
   Endpoint: POST {siteUrl}/searchAnalytics/query
   Scope: webmasters.readonly
=========================== */

export async function gscQuery(args: {
  token: string;
  siteUrl: string;
  start: string;
  end: string;
  country?: string; // e.g., "US" | "ALL"
  page?: string;
}): Promise<{ rows: GscKeywordRow[] }> {
  const { token, siteUrl, start, end, country, page } = args;

  const dims = ["query", "page", "date"]; // include date for timeseries views
  const dimensionFilterGroups: any[] = [];

  // Country filter (Search Console uses COUNTRY dimension filter)
  if (country && country !== "ALL") {
    dimensionFilterGroups.push({
      groupType: "and",
      filters: [{ dimension: "country", operator: "equals", expression: country }],
    });
  }

  // Page filter (optional)
  if (page) {
    dimensionFilterGroups.push({
      groupType: "and",
      filters: [{ dimension: "page", operator: "equals", expression: page }],
    });
  }

  const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(
    siteUrl
  )}/searchAnalytics/query`;

  const body: any = {
    startDate: start,
    endDate: end,
    dimensions: dims,
    rowLimit: 25000, // generous; Sitemaps limit is higher but API caps apply
  };

  if (dimensionFilterGroups.length) {
    body.dimensionFilterGroups = dimensionFilterGroups;
  }

  type Row = { keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number };
  type Resp = { rows?: Row[] };

  const data = await gfetch<Resp>(url, token, { method: "POST", body: JSON.stringify(body) });

  const rows: GscKeywordRow[] =
    data.rows?.map((r) => {
      const [queryV = "", pageV = "", dateV = ""] = r.keys || [];
      return {
        query: queryV,
        page: pageV,
        date: dateV,
        clicks: Number(r.clicks || 0),
        impressions: Number(r.impressions || 0),
        ctr: Number(r.ctr || 0),
        position: Number(r.position || 0),
      };
    }) || [];

  return { rows };
}

/* ===========================
   GBP — insights (safe stub)
   If you haven't enabled the GBP Performance API yet,
   we return an empty dataset to keep the UI stable.
   Scope (when you enable): https://www.googleapis.com/auth/business.manage
=========================== */

export async function gbpInsights(args: {
  token: string;
  locationId: string; // locations/{id}
  start: string;
  end: string;
}): Promise<{ rows: Array<{ date: string; calls?: number; directions?: number; websiteClicks?: number }> }> {
  const { token, locationId, start, end } = args;

  // If you want real data later, switch to:
  // const url = `https://businessprofileperformance.googleapis.com/v1/${locationId}:fetchMultiDailyMetricsTimeSeries`
  // and pass metrics + timeRange per API docs. For now, return empty rows.

  void token; void locationId; void start; void end;
  return { rows: [] };
}
