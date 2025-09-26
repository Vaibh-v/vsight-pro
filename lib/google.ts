// lib/google.ts
// Centralized Google helpers using plain fetch + OAuth access token from NextAuth.
// No 'googleapis' package required. These functions are the single source of truth
// used by integrations and API routes across the app.

import type { NextApiRequest } from "next";

// ===== Shared types =====
export type DateRange = { start: string; end: string };

// ===== Access Token =====
export async function getAccessTokenOrThrow(req: NextApiRequest): Promise<string> {
  // We avoid importing next-auth here to keep this file usable in edge runtimes.
  // Expect the access token to be forwarded on the request via header for API routes,
  // or available on the cookie-backed session exposed by a small API wrapper.
  // Fallbacks: Authorization: Bearer <token> OR x-access-token header.
  const bearer = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : undefined;
  const token = bearer || (req.headers["x-access-token"] as string | undefined);

  if (!token) {
    throw new Error("No Google access token found on request");
  }
  return token;
}

// ===== Low-level Google fetch =====
async function gFetch<T>(url: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Google API ${res.status} ${res.statusText}: ${text || url}`);
  }
  return (await res.json()) as T;
}

// ===== GA4: list properties (via account summaries) =====
type GaAccountSummariesResp = {
  accountSummaries?: Array<{
    name?: string; // accounts/{id}
    displayName?: string;
    propertySummaries?: Array<{
      property?: string; // properties/{propertyId}
      displayName?: string;
    }>;
  }>;
};

export async function listGA4Properties(
  req: NextApiRequest
): Promise<Array<{ id: string; name: string }>> {
  const token = await getAccessTokenOrThrow(req);
  const url =
    "https://analyticsadmin.googleapis.com/v1beta/accountSummaries?pageSize=200";
  const data = await gFetch<GaAccountSummariesResp>(url, token);
  const out: Array<{ id: string; name: string }> = [];

  for (const acc of data.accountSummaries || []) {
    for (const p of acc.propertySummaries || []) {
      const full = p.property || ""; // "properties/123456789"
      const id = full.split("/")[1] || full;
      out.push({ id, name: p.displayName || id });
    }
  }
  return out;
}

// ===== GA4: sessions timeseries =====
export async function ga4SessionsTimeseries(params: {
  token: string;
  propertyId: string;
  range: DateRange;
}): Promise<{ points: { date: string; value: number }[]; totalSessions: number }> {
  const { token, propertyId, range } = params;
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(
    propertyId
  )}:runReport`;

  type RunReportResp = {
    rows?: Array<{ dimensionValues?: { value?: string }[]; metricValues?: { value?: string }[] }>;
    totals?: Array<{ metricValues?: { value?: string }[] }>;
  };

  const body = {
    dateRanges: [{ startDate: range.start, endDate: range.end }],
    dimensions: [{ name: "date" }],
    metrics: [{ name: "sessions" }],
    keepEmptyRows: false,
  };

  const data = await gFetch<RunReportResp>(url, token, {
    method: "POST",
    body: JSON.stringify(body),
  });

  const points =
    (data.rows || []).map((r) => ({
      date: r.dimensionValues?.[0]?.value || "",
      value: Number(r.metricValues?.[0]?.value || 0),
    })) ?? [];

  const totalSessions = Number(data.totals?.[0]?.metricValues?.[0]?.value || 0);

  return { points, totalSessions };
}

// ===== GSC: list sites =====
type GscListSitesResp = {
  siteEntry?: Array<{ siteUrl?: string; permissionLevel?: string }>;
};

export async function gscListSites(
  req: NextApiRequest
): Promise<Array<{ siteUrl: string; permissionLevel?: string }>> {
  const token = await getAccessTokenOrThrow(req);
  const url = "https://searchconsole.googleapis.com/webmasters/v3/sites";
  const data = await gFetch<GscListSitesResp>(url, token);
  return (data.siteEntry || [])
    .filter((e) => !!e.siteUrl)
    .map((e) => ({ siteUrl: e.siteUrl!, permissionLevel: e.permissionLevel }));
}

// ===== GSC: query keywords (Search Analytics) =====
type GscQueryResp = {
  rows?: Array<{
    keys?: string[];
    clicks?: number;
    impressions?: number;
    ctr?: number;
    position?: number;
  }>;
};

export async function gscQueryKeywords(
  req: NextApiRequest,
  params?: { siteUrl?: string; start?: string; end?: string }
): Promise<{
  rows: Array<{
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
}> {
  const token = await getAccessTokenOrThrow(req);
  const siteUrlParam =
    params?.siteUrl || (req.query.siteUrl as string | undefined) || "";
  const start = params?.start || (req.query.start as string | undefined) || "";
  const end = params?.end || (req.query.end as string | undefined) || "";

  if (!siteUrlParam || !start || !end) {
    throw new Error("Missing required params: siteUrl, start, end");
  }

  const site = encodeURIComponent(siteUrlParam);
  const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${site}/searchAnalytics/query`;
  const body = {
    startDate: start,
    endDate: end,
    dimensions: ["query"],
    rowLimit: 1000,
  };

  const data = await gFetch<GscQueryResp>(url, token, {
    method: "POST",
    body: JSON.stringify(body),
  });

  const rows =
    (data.rows || []).map((r) => ({
      query: r.keys?.[0] || "",
      clicks: r.clicks ?? 0,
      impressions: r.impressions ?? 0,
      ctr: r.ctr ?? 0,
      position: r.position ?? 0,
    })) ?? [];

  return { rows };
}
