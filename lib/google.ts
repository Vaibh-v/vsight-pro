// lib/google.ts
import type { NextApiRequest } from "next";
import { getToken } from "next-auth/jwt";
import { google } from "googleapis";

/** Pull the Google OAuth access token from the NextAuth session. */
export async function getAccessToken(req: NextApiRequest): Promise<string> {
  const tok = await getToken({ req });
  const access = (tok as any)?.access_token as string | undefined;
  if (!access) throw new Error("No Google token");
  return access;
}

/** Helper: build oauth2 client from an access token. */
export function oauthFromAccessToken(accessToken: string) {
  const oauth2 = new google.auth.OAuth2();
  oauth2.setCredentials({ access_token: accessToken });
  return oauth2;
}

/* ========================= GA4 ========================= */

/** List GA4 properties the user can see (returns numeric IDs as strings). */
export async function gaListProperties(req: NextApiRequest): Promise<string[]> {
  const access = await getAccessToken(req);
  const auth = oauthFromAccessToken(access);
  const admin = google.analyticsadmin({ version: "v1beta", auth });

  const out: string[] = [];
  let pageToken: string | undefined;

  do {
    const { data } = await admin.properties.list({
      pageSize: 200,
      filter: "parent:accounts/-", // any account the user has
      pageToken,
    });
    (data.properties ?? []).forEach((p) => {
      // property.name looks like "properties/123456789"
      const id = p.name?.split("/")[1];
      if (id) out.push(id);
    });
    pageToken = data.nextPageToken ?? undefined;
  } while (pageToken);

  return out;
}

/** Run a GA4 report for a property (thin wrapper around runReport). */
export async function gaRunReport(
  req: NextApiRequest,
  propertyId: string,
  body: {
    dimensions?: { name: string }[];
    metrics?: { name: string }[];
    dateRanges?: { startDate: string; endDate: string }[];
    dimensionFilter?: any;
    metricFilter?: any;
    limit?: string;
    orderBys?: any[];
  }
) {
  const access = await getAccessToken(req);
  const auth = oauthFromAccessToken(access);
  const analytics = google.analyticsdata({ version: "v1beta", auth });

  const { data } = await analytics.properties.runReport({
    property: `properties/${propertyId}`,
    requestBody: body,
  });
  return data;
}

/* ========================= GSC (Search Console) ========================= */

/** List Search Console sites the user has verified access to. */
export async function gscListSites(req: NextApiRequest): Promise<string[]> {
  const access = await getAccessToken(req);
  const auth = oauthFromAccessToken(access);
  const webmasters = google.webmasters({ version: "v3", auth });

  const { data } = await webmasters.sites.list();
  const entries = data.siteEntry ?? [];
  // Filter out unverified
  return entries
    .filter((e) => e.permissionLevel && e.permissionLevel !== "siteUnverifiedUser")
    .map((e) => String(e.siteUrl));
}

/** Query GSC search analytics (simple daily rows). */
export async function gscQuery(
  req: NextApiRequest,
  siteUrl: string,
  startDate: string,
  endDate: string
) {
  const access = await getAccessToken(req);
  const auth = oauthFromAccessToken(access);
  const webmasters = google.webmasters({ version: "v3", auth });

  const { data } = await webmasters.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate,
      endDate,
      dimensions: ["date", "query"],
      rowLimit: 250,
    },
  });

  return data;
}
