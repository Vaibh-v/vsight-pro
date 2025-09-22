// lib/google.ts
import type { NextApiRequest } from "next";
import { getToken } from "next-auth/jwt";
import { google } from "googleapis";

export async function getAccessToken(req: NextApiRequest): Promise<string | undefined> {
  const token = await getToken({ req });
  const accessToken = (token as any)?.access_token as string | undefined;
  return accessToken;
}

export async function gaListProperties(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const admin = google.analyticsadmin("v1beta");

  // Account summaries include their property summaries
  const resp = await admin.accountSummaries.list({
    auth,
    pageSize: 200,
  });

  const items =
    resp.data.accountSummaries?.flatMap((as) =>
      (as.propertySummaries || []).map((p) => ({
        propertyId: p.property || "",
        displayName: p.displayName || p.property || "",
        account: as.name || "",
      }))
    ) || [];

  // De-dup by propertyId, just in case
  const seen = new Set<string>();
  const props = items.filter((p) => {
    if (!p.propertyId || seen.has(p.propertyId)) return false;
    seen.add(p.propertyId);
    return true;
  });

  return props;
}

export async function gscListSites(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const sc = google.searchconsole("v1");

  const resp = await sc.sites.list({ auth });
  const sites =
    (resp.data.siteEntry || [])
      // Only return sites the user actually has access to
      .filter((s) => s.permissionLevel && s.permissionLevel !== "siteUnverifiedUser")
      .map((s) => ({
        siteUrl: s.siteUrl || "",
        permissionLevel: s.permissionLevel || "",
      })) || [];

  return sites;
}

// Small helper to forward JSON or text from internal fetches
export async function forwardJsonOrText<T = any>(res: Response): Promise<T | string> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    return text;
  }
}
