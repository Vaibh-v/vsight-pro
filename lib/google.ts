import { google } from "googleapis";
import type { NextApiRequest } from "next";
import { getToken } from "next-auth/jwt";

export async function getAccessToken(req: NextApiRequest): Promise<string> {
  const tok = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const at = (tok as any)?.access_token as string | undefined;
  if (!at) throw new Error("No Google access token on session");
  return at;
}

// ------- GA4
export async function gaRunReport(
  accessToken: string,
  propertyId: string,
  body: any
) {
  const analytics = google.analyticsdata("v1beta");
  google.options({ headers: { Authorization: `Bearer ${accessToken}` } });
  const res = await analytics.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody: body,
  });
  return res.data;
}

// ------- Search Console
export async function gscQuery(
  accessToken: string,
  siteUrl: string,
  requestBody: any
) {
  const webmasters = google.searchconsole("v1");
  google.options({ headers: { Authorization: `Bearer ${accessToken}` } });
  const res = await (webmasters as any).searchanalytics.query({
    siteUrl,
    requestBody,
  });
  return res.data;
}

// (Optional) GBP: keep stub for now unless your project has access
export function gbpStubInsights() {
  const today = new Date();
  const last = new Date(today);
  last.setDate(today.getDate() - 7);
  return {
    rows: [
      {
        date: last.toISOString().slice(0, 10),
        viewsSearch: 220,
        viewsMaps: 180,
        calls: 5,
        directions: 9,
        websiteClicks: 14,
        topQueries: ["plumber", "emergency plumber", "leak repair"],
      },
      {
        date: today.toISOString().slice(0, 10),
        viewsSearch: 260,
        viewsMaps: 210,
        calls: 7,
        directions: 12,
        websiteClicks: 17,
        topQueries: ["plumber", "water heater", "pipe burst"],
      },
    ],
  };
}
