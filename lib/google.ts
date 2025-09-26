import type { NextApiRequest } from "next";
import { getToken } from "next-auth/jwt";

const ANALYTICS_ADMIN = "https://analyticsadmin.googleapis.com/v1beta";
const ANALYTICS_DATA = "https://analyticsdata.googleapis.com/v1beta";
const GSC = "https://www.googleapis.com/webmasters/v3";

/** Pull access token from the NextAuth JWT cookie for API routes */
export async function getAccessTokenOrThrow(req: NextApiRequest): Promise<string> {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const at = (token as any)?.accessToken as string | undefined;
  if (!at) throw new Error("Not authenticated. Sign in again.");
  return at;
}

/** GA4: List properties by using account summaries (simplest way). */
export async function listGA4Properties(token: string): Promise<Array<{ id: string; name: string }>> {
  const r = await fetch(`${ANALYTICS_ADMIN}/accountSummaries`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!r.ok) throw new Error(`GA Admin error: ${r.status}`);
  const json = await r.json();
  const items: Array<{ id: string; name: string }> = [];
  (json.accountSummaries ?? []).forEach((acc: any) => {
    (acc.propertySummaries ?? []).forEach((p: any) => {
      items.push({ id: (p.property as string).replace("properties/", ""), name: p.displayName });
    });
  });
  return items;
}

/** GA4: Sessions timeseries by date */
export async function ga4SessionsTimeseries(opts: {
  token: string;
  propertyId: string;
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}): Promise<{ points: Array<{ date: string; value: number }>; totalSessions: number }> {
  const { token, propertyId, start, end } = opts;
  const url = `${ANALYTICS_DATA}/properties/${encodeURIComponent(propertyId)}:runReport`;
  const body = {
    dateRanges: [{ startDate: start, endDate: end }],
    metrics: [{ name: "sessions" }],
    dimensions: [{ name: "date" }],
    keepEmptyRows: false
  };
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error(`GA Data error: ${r.status}`);
  const json = await r.json();
  const rows = json.rows ?? [];
  const points = rows.map((row: any) => {
    const d = row.dimensionValues?.[0]?.value as string; // yyyymmdd
    const iso = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
    const v = Number(row.metricValues?.[0]?.value ?? 0);
    return { date: iso, value: v };
  });
  const totalSessions =
    Number(json.totals?.[0]?.metricValues?.[0]?.value ?? 0) ||
    points.reduce((s: number, p: any) => s + (p.value || 0), 0);
  return { points, totalSessions };
}

/** GSC: list verified sites for the user */
export async function listGscSites(token: string): Promise<Array<{ siteUrl: string; permissionLevel: string }>> {
  const r = await fetch(`${GSC}/sites`, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(`GSC list error: ${r.status}`);
  const json = await r.json();
  const out = (json.siteEntry ?? []).map((s: any) => ({
    siteUrl: s.siteUrl as string,
    permissionLevel: s.permissionLevel as string
  }));
  // Filter to "siteRestrictedUser" and above? MVP: return all.
  return out;
}

/** GSC: query keywords (dimensions: query) */
export async function gscQueryKeywords(opts: {
  token: string;
  siteUrl: string;
  start: string;
  end: string;
}): Promise<
  Array<{ query: string; clicks: number; impressions: number; ctr: number; position: number }>
> {
  const { token, siteUrl, start, end } = opts;
  const url = `${GSC}/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;
  const body = {
    startDate: start,
    endDate: end,
    dimensions: ["query"],
    rowLimit: 25000
  };
  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error(`GSC query error: ${r.status}`);
  const json = await r.json();
  const rows =
    (json.rows ?? []).map((row: any) => ({
      query: row.keys?.[0] ?? "",
      clicks: Number(row.clicks ?? 0),
      impressions: Number(row.impressions ?? 0),
      ctr: Number(row.ctr ?? 0),
      position: Number(row.position ?? 0)
    })) ?? [];
  return rows;
}
