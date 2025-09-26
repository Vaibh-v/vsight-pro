// Lightweight Google helpers using fetch only (no googleapis).
// We obtain OAuth access tokens from the client request (Authorization: Bearer <token>)
// as issued by NextAuth Google provider. You can also place the token in a cookie named
// "ga_token" or "gsc_token" as a fallback if you want.

import type { NextApiRequest } from "next";

export type DateRange = { start: string; end: string };

// ---- Access token helpers ---------------------------------------------------

export function readBearerFromReq(req: NextApiRequest): string | undefined {
  const h = req.headers.authorization;
  if (typeof h === "string" && h.startsWith("Bearer ")) return h.slice(7).trim();
  // Fallbacks (optional): look in cookies
  const cookie = req.headers.cookie ?? "";
  const cookieMap = Object.fromEntries(cookie.split(";").map(s => s.trim().split("=").map(decodeURIComponent)).filter(a => a.length === 2));
  return cookieMap["ga_token"] || cookieMap["gsc_token"];
}

export function getAccessToken(req: NextApiRequest): string | undefined {
  return readBearerFromReq(req);
}

export function getAccessTokenOrThrow(req: NextApiRequest): string {
  const t = getAccessToken(req);
  if (!t) throw new Error("Missing Google OAuth access token. Ensure the client sends Authorization: Bearer <token> after signing in.");
  return t;
}

// ---- GA4 (Admin + Data) -----------------------------------------------------

export type Option = { label: string; value: string };

// Lists GA4 properties the user can access (via Account Summaries)
export async function listGA4Properties(req: NextApiRequest): Promise<Option[]> {
  const token = getAccessTokenOrThrow(req);
  const url = "https://analyticsadmin.googleapis.com/v1beta/accountSummaries";
  const out: Option[] = [];

  // Paginate just in case
  let nextPageToken: string | undefined = undefined;
  do {
    const resp = await fetch(nextPageToken ? `${url}?pageToken=${encodeURIComponent(nextPageToken)}` : url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!resp.ok) throw new Error(`GA Admin API failed: ${resp.status} ${await resp.text()}`);
    const json = await resp.json();
    const items: any[] = json.accountSummaries ?? [];
    for (const a of items) {
      const props: any[] = a.propertySummaries ?? [];
      for (const p of props) {
        out.push({ label: `${p.displayName} (${p.property})`, value: p.property });
      }
    }
    nextPageToken = json.nextPageToken;
  } while (nextPageToken);

  return out;
}

export type TrafficPoint = { date: string; value: number };

export async function ga4SessionsTimeseries(
  req: NextApiRequest,
  propertyId: string,
  range: DateRange
): Promise<{ points: TrafficPoint[]; totalSessions: number }> {
  const token = getAccessTokenOrThrow(req);
  const url = `https://analyticsdata.googleapis.com/v1beta/${propertyId}:runReport`;

  const body = {
    dateRanges: [{ startDate: range.start, endDate: range.end }],
    metrics: [{ name: "sessions" }],
    dimensions: [{ name: "date" }],
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(`GA4 Data API failed: ${resp.status} ${await resp.text()}`);
  const json = await resp.json();

  const rows: any[] = json.rows ?? [];
  const points: TrafficPoint[] = rows.map((r) => ({
    date: (r.dimensionValues?.[0]?.value as string) ?? "",
    value: Number(r.metricValues?.[0]?.value ?? "0"),
  }));

  const totalSessions = points.reduce((s, p) => s + (Number.isFinite(p.value) ? p.value : 0), 0);
  return { points, totalSessions };
}

// ---- Google Search Console --------------------------------------------------

export type GscSite = { siteUrl: string; permissionLevel?: string };

export async function gscListSites(req: NextApiRequest): Promise<GscSite[]> {
  const token = getAccessTokenOrThrow(req);
  const url = "https://www.googleapis.com/webmasters/v3/sites/list";
  const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!resp.ok) throw new Error(`GSC sites list failed: ${resp.status} ${await resp.text()}`);
  const json = await resp.json();
  const items: any[] = json.siteEntry ?? [];
  return items.map((s) => ({ siteUrl: s.siteUrl, permissionLevel: s.permissionLevel }));
}

export type GscKeywordRow = { query: string; clicks: number; impressions: number; ctr: number; position: number };

export async function gscQueryKeywords(
  req: NextApiRequest,
  siteUrl: string,
  range: DateRange
): Promise<{ rows: GscKeywordRow[] }> {
  const token = getAccessTokenOrThrow(req);
  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;

  const body = {
    startDate: range.start,
    endDate: range.end,
    dimensions: ["query"],
    rowLimit: 1000,
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(`GSC keywords query failed: ${resp.status} ${await resp.text()}`);

  const json = await resp.json();
  const rows: any[] = json.rows ?? [];
  const out: GscKeywordRow[] = rows.map((r) => ({
    query: String((r.keys ?? [])[0] ?? ""),
    clicks: Number(r.clicks ?? 0),
    impressions: Number(r.impressions ?? 0),
    ctr: Number(r.ctr ?? 0),
    position: Number(r.position ?? 0),
  }));

  return { rows: out };
}

// ---- GBP placeholder (safe no-op) ------------------------------------------
// Export a harmless placeholder so imports won't break. Replace later if needed.
export async function gbpInsights(): Promise<{ rows: any[] }> {
  return { rows: [] };
}

// Back-compat aliases if older code imports these names:
export { listGA4Properties as gaListProperties };
export { gscListSites as listGscSites };
export { gscQueryKeywords as queryGsc };
