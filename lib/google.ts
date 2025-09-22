// lib/google.ts
import type { NextApiRequest } from "next";
import { getToken } from "next-auth/jwt";

/** Get Google access token from NextAuth session (server-side API routes). */
export async function getAccessToken(req: NextApiRequest): Promise<string> {
  const token: any = await getToken({ req });
  const accessToken: string | undefined =
    token?.access_token ?? token?.accessToken ?? token?.access?.token;
  if (!accessToken) throw new Error("No Google access token on session");
  return accessToken;
}

async function googleFetch<T>(
  accessToken: string,
  url: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) {
    try {
      const parsed = JSON.parse(text);
      throw new Error(
        parsed?.error?.message || parsed?.error_description || text
      );
    } catch {
      throw new Error(text || `Google request failed: ${res.status}`);
    }
  }
  return text ? (JSON.parse(text) as T) : ({} as T);
}

/** GA4 runReport (Analytics Data API) */
export async function gaRunReport(
  req: NextApiRequest,
  propertyId: string,
  body: Record<string, any>
): Promise<any> {
  const accessToken = await getAccessToken(req);
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(
    propertyId
  )}:runReport`;
  return googleFetch<any>(accessToken, url, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** List GA4 properties via account summaries */
export async function gaListProperties(req: NextApiRequest): Promise<
  Array<{ propertyId: string; displayName: string; account: string }>
> {
  const accessToken = await getAccessToken(req);
  const url =
    "https://analyticsadmin.googleapis.com/v1beta/accountSummaries?pageSize=200";
  const data = await googleFetch<any>(accessToken, url);
  const out: Array<{ propertyId: string; displayName: string; account: string }> =
    [];
  for (const acc of data.accountSummaries ?? []) {
    for (const prop of acc.propertySummaries ?? []) {
      out.push({
        propertyId: String(prop.property?.split("/").pop() ?? prop.property),
        displayName: prop.displayName,
        account: acc.account ?? "",
      });
    }
  }
  return out;
}

/** List verified Search Console sites */
export async function gscListSites(req: NextApiRequest): Promise<
  Array<{ siteUrl: string; permissionLevel: string }>
> {
  const accessToken = await getAccessToken(req);
  const url = "https://www.googleapis.com/webmasters/v3/sites";
  const data = await googleFetch<any>(accessToken, url);
  return (data.siteEntry ?? []).map((s: any) => ({
    siteUrl: s.siteUrl,
    permissionLevel: s.permissionLevel,
  }));
}

/** Small helper for API routes */
export function asJson(res: any, payload: any, status = 200) {
  return res.status(status).json(payload);
}
// --- TEMP GBP stub so the build succeeds while GBP wiring is pending ---
export function gbpStubInsights() {
  // Fake “last 7 days” sample; replace with real Business Profile Insights later
  const today = new Date();
  const list = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400_000)
      .toISOString()
      .slice(0, 10);
    list.push({
      date: d,
      viewsSearch: 200 + Math.floor(Math.random() * 80),
      viewsMaps: 120 + Math.floor(Math.random() * 60),
      calls: 5 + Math.floor(Math.random() * 6),
      directions: 8 + Math.floor(Math.random() * 6),
      websiteClicks: 10 + Math.floor(Math.random() * 10),
      topQueries: ["plumber", "emergency plumber", "leak repair"],
    });
  }
  return { rows: list };
}
import type { NextApiRequest } from "next";
import { getToken } from "next-auth/jwt";

// 1) Pull the Google OAuth access token out of the NextAuth session/JWT
export async function getAccessToken(
  req: NextApiRequest
): Promise<string | undefined> {
  const token = (await getToken({ req })) as any;
  return token?.access_token as string | undefined;
}

// 2) GA4: list accessible properties (via Account Summaries)
export async function gaListProperties(
  accessToken: string
): Promise<any[]> {
  const resp = await fetch(
    "https://analyticsadmin.googleapis.com/v1beta/accountSummaries",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  const json = await resp.json();
  if (!resp.ok) {
    throw new Error(json?.error?.message || "GA Admin API failed");
  }
  return json?.accountSummaries ?? [];
}

// 3) (already added earlier) GBP stub — keep while wiring real API
export function gbpStubInsights() {
  const today = new Date();
  const rows: any[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400_000)
      .toISOString()
      .slice(0, 10);
    rows.push({
      date: d,
      viewsSearch: 200 + Math.floor(Math.random() * 80),
      viewsMaps: 120 + Math.floor(Math.random() * 60),
      calls: 5 + Math.floor(Math.random() * 6),
      directions: 8 + Math.floor(Math.random() * 6),
      websiteClicks: 10 + Math.floor(Math.random() * 10),
      topQueries: ["plumber", "emergency plumber", "leak repair"],
    });
  }
  return { rows };
}
