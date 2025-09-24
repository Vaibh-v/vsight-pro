// /lib/google.ts
// Google helpers (GA4, GSC, GBP) using fetch + OAuth token from NextAuth.

import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { z } from "zod";

/* ----------------------------- Session / Token ----------------------------- */

export async function getAccessTokenOrThrow() {
  const session = await getServerSession(authOptions);
  const token = (session as any)?.accessToken as string | undefined;
  if (!token) {
    const e = new Error("Unauthorized: missing Google access token");
    (e as any).status = 401;
    throw e;
  }
  return token;
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

/* ---------------------------------- GA4 ----------------------------------- */

/** More compatible GA4 property listing (prefers Account Summaries) */
export async function listGA4Properties(token: string) {
  // Preferred: summaries (accounts + properties in one call)
  const sumRes = await fetch("https://analyticsadmin.googleapis.com/v1beta/accountSummaries", {
    headers: authHeaders(token),
  });
  if (sumRes.ok) {
    const json = await sumRes.json();
    const out: { id: string; name: string; accountName?: string }[] = [];
    for (const acc of json.accountSummaries ?? []) {
      const accountName = acc.name; // "accountSummaries/123"
      for (const p of acc.propertySummaries ?? []) {
        out.push({
          id: p.property,          // "properties/XXXX"
          name: p.displayName,     // property display name
          accountName,
        });
      }
    }
    return out;
  }

  // Fallback: list accounts then properties per account
  const accRes = await fetch("https://analyticsadmin.googleapis.com/v1beta/accounts", {
    headers: authHeaders(token),
  });
  if (!accRes.ok) {
    const err = await safeJson(accRes);
    throw new Error(err?.error?.message || `GA Admin accounts failed (${accRes.status})`);
  }
  const accJson = await accRes.json();
  const accounts: { name: string }[] = accJson.accounts ?? [];

  const out: { id: string; name: string; accountName?: string }[] = [];
  for (const acc of accounts) {
    const propsRes = await fetch(
      `https://analyticsadmin.googleapis.com/v1beta/${acc.name}/properties?showDeleted=false`,
      { headers: authHeaders(token) }
    );
    if (!propsRes.ok) continue;
    const propsJson = await propsRes.json();
    for (const p of propsJson.properties ?? []) {
      out.push({ id: p.name, name: p.displayName, accountName: acc.name });
    }
  }
  return out;
}

/** GA4 sessions timeseries via Analytics Data API */
export async function ga4SessionsTimeseries(params: {
  token: string;
  propertyId: string; // "properties/XXXX"
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}) {
  const body = {
    dimensions: [{ name: "date" }],
    metrics: [{ name: "sessions" }],
    dateRanges: [{ startDate: params.start, endDate: params.end }],
  };
  const url = `https://analyticsdata.googleapis.com/v1beta/${params.propertyId}:runReport`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(params.token) },
    body: JSON.stringify(body),
  });
  const json = await safeJson(res);
  if (!res.ok) throw new Error(json?.error?.message || "GA4 runReport failed");

  const rows = Array.isArray(json?.rows) ? json.rows : [];
  const points = rows.map((r: any) => ({
    date: r.dimensionValues?.[0]?.value as string,
    sessions: Number(r.metricValues?.[0]?.value ?? 0),
  }));
  const total = points.reduce((acc: number, p: any) => acc + (p.sessions || 0), 0);
  return { points, totalSessions: total };
}

/* ---------------------------------- GSC ----------------------------------- */

export async function listGscSites(token: string) {
  const res = await fetch("https://www.googleapis.com/webmasters/v3/sites", {
    headers: authHeaders(token),
  });
  const json = await safeJson(res);
  if (!res.ok) throw new Error(json?.error?.message || "GSC sites failed");
  return (json?.siteEntry ?? []).map((s: any) => ({
    siteUrl: s.siteUrl as string,
    permission: s.permissionLevel as string,
  }));
}

export async function gscQuery(params: {
  token: string;
  siteUrl: string;
  start: string;
  end: string;
  country?: string;  // 'ALL' or ISO code
  pagePath?: string; // optional filter
}) {
  type Dim = "date" | "query" | "page" | "country";
  const dimensions: Dim[] = ["date", "query", "page"];
  const filters: any[] = [];

  if (params.country && params.country !== "ALL") {
    dimensions.push("country");
    filters.push({ dimension: "country", operator: "equals", expression: params.country });
  }
  if (params.pagePath) {
    filters.push({ dimension: "page", operator: "contains", expression: params.pagePath });
  }

  const body: any = {
    startDate: params.start,
    endDate: params.end,
    dimensions,
    rowLimit: 25000,
  };
  if (filters.length) body.dimensionFilterGroups = [{ groupType: "and", filters }];

  const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(
    params.siteUrl
  )}/searchAnalytics/query`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(params.token) },
    body: JSON.stringify(body),
  });
  const json = await safeJson(res);
  if (!res.ok) throw new Error(json?.error?.message || "GSC query failed");

  const rows: any[] = json?.rows ?? [];
  return rows.map((r: any) => {
    const keys: string[] = r.keys ?? [];
    const map: Record<string, string> = {};
    dimensions.forEach((d, i) => (map[d] = keys[i]));
    return {
      date: map.date,
      query: map.query,
      page: map.page,
      country: map.country,
      clicks: r.clicks ?? 0,
      impressions: r.impressions ?? 0,
      ctr: r.ctr ?? 0,
      position: r.position ?? 0,
    };
  });
}

/* ---------------------------------- GBP ----------------------------------- */

export async function gbpInsights(params: {
  token: string;
  locationId: string; // "locations/XXXX"
  start: string;
  end: string;
}) {
  const url = `https://businessprofileperformance.googleapis.com/v1/${params.locationId}:fetchMultiDailyMetricsTimeSeries`;
  const body = {
    dailyMetrics: [
      "CALL_CLICKS",
      "DIRECTION_REQUESTS",
      "WEBSITE_CLICKS",
      "BUSINESS_IMPRESSIONS_SEARCH",
      "BUSINESS_IMPRESSIONS_MAPS",
    ],
    timeRange: { startDate: params.start, endDate: params.end },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(params.token) },
    body: JSON.stringify(body),
  });
  const json = await safeJson(res);
  if (!res.ok) throw new Error(json?.error?.message || "GBP insights failed");

  const rows: Array<{
    date: string;
    calls: number;
    directions: number;
    websiteClicks: number;
    viewsSearch: number;
    viewsMaps: number;
  }> = [];

  const seriesList = json?.timeSeries ?? json?.time_series ?? [];
  for (const series of seriesList) {
    const metric = series.dailyMetric || series.metric || series.metricType || series.daily_metric;
    const points = series.timeSeries || series.points || series.time_series || [];
    for (const p of points) {
      const date = p.date || p.dimensions?.date || p?.timeDimension?.time || p?.time || "";
      const val = Number(p.value ?? p.measurement ?? p?.values?.[0] ?? 0);
      let row = rows.find((r) => r.date === date);
      if (!row) {
        row = { date, calls: 0, directions: 0, websiteClicks: 0, viewsSearch: 0, viewsMaps: 0 };
        rows.push(row);
      }
      if (metric === "CALL_CLICKS") row.calls = val;
      if (metric === "DIRECTION_REQUESTS") row.directions = val;
      if (metric === "WEBSITE_CLICKS") row.websiteClicks = val;
      if (metric === "BUSINESS_IMPRESSIONS_SEARCH") row.viewsSearch = val;
      if (metric === "BUSINESS_IMPRESSIONS_MAPS") row.viewsMaps = val;
    }
  }
  return rows.sort((a, b) => a.date.localeCompare(b.date));
}

/* --------------------------------- Schemas -------------------------------- */
export const InputRangeSchema = z.object({
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/* --------------------------------- Helpers -------------------------------- */
async function safeJson(res: Response) {
  try { return await res.json(); } catch { return null; }
}

/* ------------------------------ Legacy Aliases ----------------------------- */
export const getAccessToken = getAccessTokenOrThrow;
export const gaListProperties = listGA4Properties;
export const gscListSites = listGscSites;
export async function gscQueryKeywords(p: {
  token: string; siteUrl: string; start: string; end: string; country?: string; pagePath?: string;
}) { return gscQuery(p); }
