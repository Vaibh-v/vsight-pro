// pages/api/google/gsc/sites.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getAccessToken } from "@/lib/google";

/**
 * Lists Search Console sites available to the authenticated user.
 * Returns: { siteEntries: Array<{ siteUrl: string; permissionLevel: string }> }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const accessToken = await getAccessToken(req);
    if (!accessToken) {
      return res.status(401).json({ error: "No Google access token" });
    }

    const resp = await fetch(
      "https://www.googleapis.com/webmasters/v3/sites/list",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!resp.ok) {
      const text = await resp.text();
      return res
        .status(resp.status)
        .json({ error: "Failed to list GSC sites", details: text });
    }

    const data = await resp.json();
    // data = { siteEntry?: Array<{ siteUrl: string; permissionLevel: string }> }
    return res.status(200).json({ siteEntries: data.siteEntry ?? [] });
  } catch (err: any) {
    return res
      .status(500)
      .json({ error: "Unexpected server error", details: err?.message });
  }
}
