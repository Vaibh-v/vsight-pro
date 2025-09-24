// lib/google.ts
import type { NextApiRequest } from "next";
import { getToken } from "next-auth/jwt";

/** Get Google access token from NextAuth session (server-side API routes). */
export async function getAccessToken(req: NextApiRequest): Promise<string | null> {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const access = (token as any)?.google_access_token as string | undefined;
  return access ?? null;
}

/** GA4 Admin: list properties with display names via accountSummaries. */
export async function ga4ListProperties(accessToken: string) {
  const resp = await fetch("https://analyticsadmin.googleapis.com/v1beta/accountSummaries", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!resp.ok) throw new Error(`GA Admin list failed: ${resp.status} ${await resp.text()}`);
  const data = await resp.json();
  const properties =
    (data.accountSummaries ?? []).flatMap((acc: any) =>
      (acc.propertySummaries ?? []).map((p: any) => ({
        id: p.property,           // "properties/123456789"
        displayName: p.displayName,
        account: acc.name         // "accounts/12345"
      }))
    );
  return properties;
}

/** GA4 Data API: runReport wrapper. requestBody matches GA4 schema. */
export async function gaRunReport(
  accessToken: string,
  property: string,              // "properties/123456789" (or numeric id; we'll normalize)
  requestBody: Record<string, any>
) {
  const normalized = property.startsWith("properties/") ? property : `properties/${property}`;
  const url = `https://analyticsdata.googleapis.com/v1beta/${encodeURIComponent(normalized)}:runReport`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(requestBody)
  });
  if (!resp.ok) throw new Error(`GA runReport failed: ${resp.status} ${await resp.text()}`);
  return resp.json();
}

/** GSC: list sites for the account. */
export async function gscListSites(accessToken: string) {
  const resp = await fetch("https://www.googleapis.com/webmasters/v3/sites/list", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!resp.ok) throw new Error(`GSC site list failed: ${resp.status} ${await resp.text()}`);
  const data = await resp.json();
  return data.siteEntry ?? [];
}

/** GSC: query keywords (Search Analytics) for a site. */
export async function gscQueryKeywords(
  accessToken: string,
  siteUrl: string,
  start: string,
  end: string,
  rowLimit = 250
) {
  const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;
  const body = {
    startDate: start,
    endDate: end,
    dimensions: ["query"],
    rowLimit
  };
  const resp = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!resp.ok) throw new Error(`GSC query failed: ${resp.status} ${await resp.text()}`);
  return resp.json();
}

/** Temporary stub so `gbp/insights` never breaks builds while we wire the API. */
export function gbpStubInsights() {
  return {
    rows: [
      {
        date: "2025-09-15",
        viewsSearch: 220,
        viewsMaps: 180,
        calls: 5,
        directions: 9,
        websiteClicks: 14,
        topQueries: ["plumber", "emergency plumber", "leak repair"]
      }
    ]
  };
}
