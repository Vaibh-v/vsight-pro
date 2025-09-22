// lib/google.ts

// IMPORTANT: do NOT re-declare NextApiRequest anywhere else.
// Some repos define a global type alias; importing it here can
// cause “Duplicate identifier 'NextApiRequest'” depending on tsconfig.
// To avoid that entirely we keep our signature permissive and don’t
// import the type at all.

import { getToken } from "next-auth/jwt";

/**
 * Accepts either:
 *  - a Next.js API req object (we’ll extract the Google access_token), or
 *  - a raw access token string (useful for internal calls)
 * Returns the OAuth access token or null.
 */
export async function getAccessToken(reqOrToken: any): Promise<string | null> {
  if (!reqOrToken) return null;
  if (typeof reqOrToken === "string") return reqOrToken;

  // Treat as NextApiRequest
  try {
    const token = await getToken({ req: reqOrToken });
    return (token as any)?.access_token ?? null;
  } catch {
    return null;
  }
}

/** Helper for Google REST calls with bearer token. */
async function gFetch<T>(url: string, accessToken: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Google API ${res.status} ${res.statusText}: ${text || url}`);
  }
  return (await res.json()) as T;
}

/* =========================
   GA4 – list properties
   ========================= */

/**
 * Lists GA4 properties visible to the signed-in user via the
 * Analytics Admin API accountSummaries endpoint.
 * Scope required: https://www.googleapis.com/auth/analytics.readonly (sensitive)
 */
export async function gaListProperties(reqOrToken: any) {
  const accessToken = await getAccessToken(reqOrToken);
  if (!accessToken) throw new Error("No Google access token");

  type AccountSummariesResponse = {
    accountSummaries?: Array<{
      name: string;           // "accounts/123"
      account: string;        // "accounts/123"
      displayName?: string;   // Account name
      propertySummaries?: Array<{
        property: string;     // "properties/376569938"
        displayName?: string; // Property name
      }>;
    }>;
  };

  const data = await gFetch<AccountSummariesResponse>(
    "https://analyticsadmin.googleapis.com/v1beta/accountSummaries",
    accessToken
  );

  const properties =
    (data.accountSummaries ?? []).flatMap((acct) =>
      (acct.propertySummaries ?? []).map((p) => ({
        property: p.property,
        propertyId: p.property.replace("properties/", ""),
        propertyName: p.displayName ?? p.property,
        accountName: acct.displayName ?? acct.account,
        account: acct.account.replace("accounts/", ""),
      }))
    );

  return properties;
}

/* =========================
   GA4 – runReport for traffic
   ========================= */

/**
 * GA4 runReport example.
 * metrics: sessions
 * dimensions: date
 * Scope required: https://www.googleapis.com/auth/analytics.readonly
 */
export async function gaRunReport(
  reqOrToken: any,
  propertyId: string,
  startDate: string,
  endDate: string
) {
  const accessToken = await getAccessToken(reqOrToken);
  if (!accessToken) throw new Error("No Google access token");

  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(
    propertyId
  )}:runReport`;

  const body = {
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: "date" }],
    metrics: [{ name: "sessions" }],
  };

  type RunReportResponse = {
    rows?: Array<{
      dimensionValues?: Array<{ value?: string }>;
      metricValues?: Array<{ value?: string }>;
    }>;
  };

  const data = await gFetch<RunReportResponse>(url, accessToken, {
    method: "POST",
    body: JSON.stringify(body),
  });

  const points =
    (data.rows ?? []).map((r) => ({
      date: (r.dimensionValues?.[0]?.value ?? "").replace(/-/g, ""),
      sessions: Number(r.metricValues?.[0]?.value ?? "0"),
    })) || [];

  return { points };
}

/* =========================
   GSC – list verified sites
   ========================= */

/**
 * Lists verified Search Console sites for the user.
 * Scope required: https://www.googleapis.com/auth/webmasters.readonly (sensitive)
 */
export async function gscListSites(reqOrToken: any) {
  const accessToken = await getAccessToken(reqOrToken);
  if (!accessToken) throw new Error("No Google access token");

  type SitesListResponse = {
    siteEntry?: Array<{ siteUrl: string; permissionLevel: string }>;
  };

  const data = await gFetch<SitesListResponse>(
    "https://www.googleapis.com/webmasters/v3/sites/list",
    accessToken
  );

  const sites =
    (data.siteEntry ?? [])
      .filter((s) => /^(sc-domain:|https?:)/.test(s.siteUrl)) // keep domain or URL properties
      .map((s) => ({ siteUrl: s.siteUrl, permission: s.permissionLevel })) || [];

  return sites;
}

/* =========================
   GSC – simple query example (keywords last 7 days)
   ========================= */

export async function gscQueryKeywords(
  reqOrToken: any,
  siteUrl: string,
  startDate: string,
  endDate: string
) {
  const accessToken = await getAccessToken(reqOrToken);
  if (!accessToken) throw new Error("No Google access token");

  const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(
    siteUrl
  )}/searchAnalytics/query`;

  const body = {
    startDate,
    endDate,
    dimensions: ["query"],
    rowLimit: 250,
  };

  type QueryResponse = {
    rows?: Array<{
      keys?: string[];
      clicks?: number;
      impressions?: number;
      ctr?: number;
      position?: number;
    }>;
  };

  const data = await gFetch<QueryResponse>(url, accessToken, {
    method: "POST",
    body: JSON.stringify(body),
  });

  const rows =
    (data.rows ?? []).map((r) => ({
      date: undefined,
      query: r.keys?.[0] ?? "",
      clicks: r.clicks ?? 0,
      impressions: r.impressions ?? 0,
      ctr: r.ctr ?? 0,
      position: r.position ?? 0,
      country: "ALL",
    })) || [];

  return { rows };
}

/* =========================
   GBP – safe stub (keeps builds green)
   ========================= */

export function gbpStubInsights() {
  // last 7 days of simple mock data
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });

  return {
    rows: days.map((date) => ({
      date,
      viewsSearch: Math.round(180 + Math.random() * 120),
      viewsMaps: Math.round(90 + Math.random() * 120),
      calls: Math.round(3 + Math.random() * 6),
      directions: Math.round(5 + Math.random() * 10),
      websiteClicks: Math.round(10 + Math.random() * 10),
      topQueries: ["plumber", "emergency plumber", "leak repair"].slice(
        0,
        1 + Math.floor(Math.random() * 3)
      ),
    })),
  };
}
