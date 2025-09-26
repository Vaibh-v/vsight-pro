import type { NextApiRequest } from "next";

function bearerFromReq(req: NextApiRequest): string | undefined {
  const h = req.headers.authorization;
  if (!h) return undefined;
  if (!h.startsWith("Bearer ")) return undefined;
  return h.slice(7).trim();
}

/** Get Google OAuth access token from `Authorization: Bearer <token>` header. */
export function getAccessTokenOrThrow(req: NextApiRequest): string {
  const token = bearerFromReq(req);
  if (!token) {
    throw new Error("Missing Authorization Bearer token");
  }
  return token;
}

/** GA4: list properties for all accessible accounts */
export async function listGA4Properties(token: string): Promise<
  { name: string; propertyId: string; displayName: string }[]
> {
  // 1) list accounts
  const accRes = await fetch("https://analyticsadmin.googleapis.com/v1beta/accounts", {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!accRes.ok) {
    // 403/401 are common if the user didn't grant Admin API. Return empty list gracefully.
    return [];
  }
  const accJson: any = await accRes.json();
  const accounts: string[] = (accJson.accounts || []).map((a: any) => a.name); // e.g. "accounts/12345"
  if (!accounts.length) return [];

  // 2) list properties per account
  const allProps: { name: string; propertyId: string; displayName: string }[] = [];
  for (const accountName of accounts) {
    const url = `https://analyticsadmin.googleapis.com/v1beta/${accountName}/properties?pageSize=200`;
    const pRes = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!pRes.ok) continue;
    const pJson: any = await pRes.json();
    for (const p of pJson.properties || []) {
      // p.name is like "properties/123456789"
      const id = (p.name || "").split("/")[1] || "";
      allProps.push({ name: p.name, propertyId: id, displayName: p.displayName || id });
    }
  }

  return allProps;
}

/** GA4: sessions timeseries */
export async function ga4SessionsTimeseries(params: {
  token: string;
  propertyId: string;
  start: string; // "YYYY-MM-DD"
  end: string;   // "YYYY-MM-DD"
}): Promise<{ points: { date: string; value: number }[]; totalSessions: number }> {
  const { token, propertyId, start, end } = params;
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;
  const body = {
    dateRanges: [{ startDate: start, endDate: end }],
    metrics: [{ name: "sessions" }],
    dimensions: [{ name: "date" }],
    keepEmptyRows: false
  };

  const r = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!r.ok) {
    // Return empty to avoid blowing up UI
    return { points: [], totalSessions: 0 };
  }

  const j: any = await r.json();
  const rows: any[] = j.rows || [];
  const points = rows.map((row: any) => {
    const d = row.dimensionValues?.[0]?.value || ""; // "20240925"
    const yyyy = d.slice(0, 4), mm = d.slice(4, 6), dd = d.slice(6, 8);
    const date = `${yyyy}-${mm}-${dd}`;
    const sessions = Number(row.metricValues?.[0]?.value || 0);
    return { date, value: sessions };
  });

  const totalSessions = points.reduce((s, p) => s + p.value, 0);
  return { points, totalSessions };
}

/** GSC: list sites accessible to the user */
export async function gscListSites(token: string): Promise<{ siteUrl: string; permissionLevel: string }[]> {
  const r = await fetch("https://searchconsole.googleapis.com/webmasters/v3/sites/list", {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!r.ok) return [];
  const j: any = await r.json();
  const entries = j.siteEntry || [];
  return entries.map((e: any) => ({
    siteUrl: e.siteUrl,
    permissionLevel: e.permissionLevel
  }));
}

/** GSC: query keywords (rows for query dimension) */
export async function gscQueryKeywords(params: {
  token: string;
  siteUrl: string;
  start: string;
  end: string;
  rowLimit?: number;
}): Promise<{
  rows: { query: string; clicks: number; impressions: number; ctr: number; position: number }[];
}> {
  const { token, siteUrl, start, end, rowLimit = 250 } = params;
  const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;
  const body = {
    startDate: start,
    endDate: end,
    dimensions: ["query"],
    rowLimit
  };

  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!r.ok) return { rows: [] };

  const j: any = await r.json();
  const rows: any[] = j.rows || [];
  return {
    rows: rows.map((row: any) => ({
      query: row.keys?.[0] || "",
      clicks: Number(row.clicks || 0),
      impressions: Number(row.impressions || 0),
      ctr: Number(row.ctr || 0),
      position: Number(row.position || 0)
    }))
  };
}
