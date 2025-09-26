// lib/google.ts
import type { NextApiRequest } from "next";
import { getToken } from "next-auth/jwt";

/** NextAuth JWT shape (adjust if your fields differ). */
type GoogleJWT = {
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpires?: number; // ms epoch
};

/** Get a valid Google access token (refreshing if necessary). */
export async function getAccessToken(req: NextApiRequest): Promise<string> {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET missing");

  const token = (await getToken({ req, secret })) as GoogleJWT | null;
  if (!token?.accessToken) throw new Error("Not authenticated with Google");

  const now = Date.now();
  if (token.accessTokenExpires && now < token.accessTokenExpires - 30_000) {
    return token.accessToken;
  }

  if (!token.refreshToken) {
    throw new Error("Google refresh token missing. Reconnect your Google account.");
  }
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Google OAuth envs missing");

  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: token.refreshToken,
    }),
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Failed to refresh Google token (${resp.status}): ${txt}`);
  }
  const json = (await resp.json()) as { access_token: string; expires_in?: number };
  return json.access_token;
}

/** Back-compat for old imports in lib/integrations/ga.ts */
export const getAccessTokenOrThrow = getAccessToken;

/** Low-level GET with Bearer header */
export async function googleGet<T = any>(req: NextApiRequest, url: string): Promise<T> {
  const accessToken = await getAccessToken(req);
  const r = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!r.ok) {
    const body = await r.text();
    throw new Error(`Google API ${r.status}: ${body || url}`);
  }
  return (await r.json()) as T;
}

/** Low-level POST with Bearer header + JSON body */
async function googlePostJson<T = any>(
  req: NextApiRequest,
  url: string,
  body: Record<string, any>
): Promise<T> {
  const accessToken = await getAccessToken(req);
  const r = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`Google API ${r.status}: ${text || url}`);
  }
  return (await r.json()) as T;
}

/** GA4: list properties via Analytics Admin API */
export async function listGA4Properties(
  req: NextApiRequest
): Promise<Array<{ id: string; name: string }>> {
  type AdminResp = {
    accountSummaries?: Array<{
      propertySummaries?: Array<{ property?: string; displayName?: string }>;
    }>;
  };
  const data = await googleGet<AdminResp>(
    req,
    "https://analyticsadmin.googleapis.com/v1beta/accountSummaries"
  );

  const out: Array<{ id: string; name: string }> = [];
  for (const acc of data.accountSummaries ?? []) {
    for (const p of acc.propertySummaries ?? []) {
      const id = (p.property || "").split("/")[1] || "";
      if (id) out.push({ id, name: p.displayName || `Property ${id}` });
    }
  }
  return out;
}

/** GSC: list verified sites */
export async function listGscSites(
  req: NextApiRequest
): Promise<Array<{ siteUrl: string; permissionLevel: string }>> {
  type SitesResp = { siteEntry?: Array<{ siteUrl: string; permissionLevel: string }> };
  const data = await googleGet<SitesResp>(req, "https://www.googleapis.com/webmasters/v3/sites");
  return (data.siteEntry ?? []).map((s) => ({ siteUrl: s.siteUrl, permissionLevel: s.permissionLevel }));
}

/**
 * GA4: sessions timeseries (daily)
 * Returns { points: {date, sessions}[], totalSessions: number }
 * Kept here so legacy code can `import { ga4SessionsTimeseries } from "@/lib/google"`.
 */
export async function ga4SessionsTimeseries(
  req: NextApiRequest,
  propertyId: string,
  start: string,
  end: string
): Promise<{ points: Array<{ date: string; sessions: number }>; totalSessions: number }> {
  type RunReportResp = {
    rows?: Array<{ dimensionValues?: Array<{ value?: string }>; metricValues?: Array<{ value?: string }> }>;
  };

  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(
    propertyId
  )}:runReport`;

  const body = {
    dateRanges: [{ startDate: start, endDate: end }],
    metrics: [{ name: "sessions" }],
    dimensions: [{ name: "date" }],
  };

  const data = await googlePostJson<RunReportResp>(req, url, body);

  const points: Array<{ date: string; sessions: number }> = [];
  let total = 0;

  for (const row of data.rows ?? []) {
    const d = row.dimensionValues?.[0]?.value || "";
    const vRaw = row.metricValues?.[0]?.value || "0";
    const v = Number(vRaw);
    total += isNaN(v) ? 0 : v;
    // Convert YYYYMMDD -> YYYY-MM-DD for nicer display
    const date = d && d.length === 8 ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}` : d;
    points.push({ date, sessions: isNaN(v) ? 0 : v });
  }

  return { points, totalSessions: total };
}
