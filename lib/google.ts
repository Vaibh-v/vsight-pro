import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { z } from "zod";

export async function getAccessTokenOrThrow() {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).accessToken) {
    const e = new Error("Unauthorized: missing Google access token");
    (e as any).status = 401;
    throw e;
  }
  return (session as any).accessToken as string;
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

/** GA4: list properties (accounts.list + properties via Data API is limited; use Admin API) */
export async function listGA4Properties(token: string) {
  // Admin API: accounts.list → properties.list under each account
  // To simplify rate/complexity, hit properties.search (beta) alt; if not available, fallback to accounts loop.
  // Here, we use accounts list + properties list.
  const accRes = await fetch("https://analyticsadmin.googleapis.com/v1beta/accounts", {
    headers: authHeaders(token),
  });
  if (!accRes.ok) throw new Error(`GA Admin accounts failed: ${accRes.statusText}`);
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
    const props = propsJson.properties ?? [];
    for (const p of props) {
      out.push({
        id: p.name, // e.g. properties/123456789
        name: p.displayName,
        accountName: acc.name,
      });
    }
  }
  return out;
}

/** GA4: timeseries sessions via Data API (runReport) */
export async function ga4SessionsTimeseries(params: {
  token: string;
  propertyId: string; // properties/XXXX
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
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || "GA4 runReport failed");

  const points = (json.rows ?? []).map((r: any) => ({
    date: r.dimensionValues[0].value,
    sessions: Number(r.metricValues[0].value ?? 0),
  }));
  const total = points.reduce((a: number, b: any) => a + (b.sessions || 0), 0);
  return { points, totalSessions: total };
}

/** GSC: list verified sites */
export async function listGscSites(token: string) {
  const res = await fetch("https://www.googleapis.com/webmasters/v3/sites", {
    headers: authHeaders(token),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || "GSC sites failed");
  const items = (json.siteEntry ?? []).map((s: any) => ({
    siteUrl: s.siteUrl,
    permission: s.permissionLevel,
  }));
  return items;
}

/** GSC: search analytics rows (queries/pages across a date range) */
export async function gscQuery(params: {
  token: string;
  siteUrl: string;
  start: string;
  end: string;
  country?: string; // ISO country code or 'ALL'
  pagePath?: string; // optional filter for page
}) {
  // Build request
  type Dimension = "date" | "query" | "page" | "country" | "device";
  const dimensions: Dimension[] = ["date", "query", "page"];
  if (params.country && params.country !== "ALL") dimensions.push("country");

  const requestBody: any = {
    startDate: params.start,
    endDate: params.end,
    dimensions,
    rowLimit: 25000,
  };

  // Optional filters
  const filters: any[] = [];
  if (params.pagePath) {
    filters.push({
      dimension: "page",
      operator: "contains",
      expression: params.pagePath,
    });
  }
  if (params.country && params.country !== "ALL") {
    filters.push({
      dimension: "country",
      operator: "equals",
      expression: params.country,
    });
  }
  if (filters.length) {
    requestBody.dimensionFilterGroups = [{ groupType: "and", filters }];
  }

  const res = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(
      params.siteUrl
    )}/searchAnalytics/query`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders(params.token) },
      body: JSON.stringify(requestBody),
    }
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || "GSC query failed");

  const rows = (json.rows ?? []).map((r: any) => {
    const dims = r.keys ?? [];
    const map: Record<string, string> = {};
    dimensions.forEach((d, i) => (map[d] = dims[i]));
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
  return rows;
}

/** GBP (v1.1): simple daily insights (calls/directions/website clicks). */
export async function gbpInsights(params: {
  token: string;
  locationId: string; // locations/XXXX
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}) {
  // NB: The Business Profile Performance API has specific endpoints. This uses an illustrative path.
  // Replace with the exact metrics endpoint once enabled in your Google Cloud project.
  const url = `https://businessprofileperformance.googleapis.com/v1/${params.locationId}:fetchMultiDailyMetricsTimeSeries`;
  const body = {
    dailyMetrics: ["CALL_CLICKS", "DIRECTION_REQUESTS", "WEBSITE_CLICKS", "BUSINESS_IMPRESSIONS_SEARCH", "BUSINESS_IMPRESSIONS_MAPS"],
    timeRange: { startDate: params.start, endDate: params.end },
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(params.token) },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || "GBP insights failed");

  // Normalize (shape depends on API response)
  // Return rows of {date, calls, directions, websiteClicks, viewsSearch, viewsMaps}
  const rows: any[] = [];
  for (const series of json.timeSeries ?? []) {
    const metric = series.dailyMetric;
    for (const p of series.timeSeries ?? []) {
      const date = p.date;
      const val = Number(p.value ?? 0);
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

export const InputRangeSchema = z.object({
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
