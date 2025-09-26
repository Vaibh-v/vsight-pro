// lib/google.ts
import type { NextApiRequest } from "next";
import { getToken } from "next-auth/jwt";

/**
 * Shape we store in the NextAuth JWT (see [...nextauth].ts).
 * If your names differ, update here.
 */
type GoogleJWT = {
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpires?: number; // ms epoch
};

/**
 * Return a fresh Google access token (auto-refresh using refresh_token if needed).
 * Throws 401/500 style errors that your API routes will convert to JSON.
 */
export async function getAccessToken(req: NextApiRequest): Promise<string> {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET missing");
  }

  // Read the JWT issued by NextAuth
  const token = (await getToken({ req, secret })) as GoogleJWT | null;
  if (!token?.accessToken) {
    throw new Error("Not authenticated with Google");
  }

  // If not expired, use it
  const now = Date.now();
  if (token.accessTokenExpires && now < token.accessTokenExpires - 30_000) {
    return token.accessToken;
  }

  // Need to refresh
  if (!token.refreshToken) {
    // We have no refresh token. Ask user to reconnect Google.
    throw new Error("Google refresh token missing. Reconnect your Google account.");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth envs missing");
  }

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

  const json = (await resp.json()) as {
    access_token: string;
    expires_in?: number; // seconds
    scope?: string;
    token_type?: string;
  };

  // We can’t persist back into the JWT here (that happens in NextAuth callbacks),
  // so just return the new token for this request:
  return json.access_token;
}

/**
 * Fetch helper that attaches Google Bearer token.
 */
export async function googleGet<T = any>(req: NextApiRequest, url: string): Promise<T> {
  const accessToken = await getAccessToken(req);
  const r = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    // GSC & Admin APIs are JSON by default
  });
  if (!r.ok) {
    const body = await r.text();
    throw new Error(`Google API ${r.status}: ${body || url}`);
  }
  return (await r.json()) as T;
}

/**
 * List GA4 properties for the signed-in user.
 * Uses Analytics Admin API accountSummaries.
 * Returns [{ id, name }]
 */
export async function listGA4Properties(req: NextApiRequest): Promise<Array<{ id: string; name: string }>> {
  type AdminResp = {
    accountSummaries?: Array<{
      name?: string; // "accountSummaries/{accountId}"
      account?: string;
      displayName?: string;
      propertySummaries?: Array<{ property?: string; displayName?: string }>; // property like "properties/12345"
    }>;
  };

  const url = "https://analyticsadmin.googleapis.com/v1beta/accountSummaries";
  const data = await googleGet<AdminResp>(req, url);

  const out: Array<{ id: string; name: string }> = [];
  for (const acc of data.accountSummaries ?? []) {
    for (const p of acc.propertySummaries ?? []) {
      const id = (p.property || "").split("/")[1] || "";
      if (id) out.push({ id, name: p.displayName || `Property ${id}` });
    }
  }
  return out;
}

/**
 * List GSC sites for the signed-in user.
 * Returns [{ siteUrl, permission }]
 */
export async function listGscSites(
  req: NextApiRequest
): Promise<Array<{ siteUrl: string; permissionLevel: string }>> {
  type SitesResp = { siteEntry?: Array<{ siteUrl: string; permissionLevel: string }> };
  const url = "https://www.googleapis.com/webmasters/v3/sites";
  const data = await googleGet<SitesResp>(req, url);
  return (data.siteEntry ?? []).map((s) => ({ siteUrl: s.siteUrl, permissionLevel: s.permissionLevel }));
}
