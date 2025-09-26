import type { NextApiRequest } from "next";
import { getAccessTokenOrThrow, gscListSites, gscQueryKeywords } from "@/lib/google";

export type DateRange = { start: string; end: string };

export async function listGscSites(req: NextApiRequest) {
  const token = getAccessTokenOrThrow(req);
  return gscListSites(token);
}

/** Reads `siteUrl`, `start`, `end` from req.query and returns keyword rows */
export async function queryGscKeywords(req: NextApiRequest) {
  const token = getAccessTokenOrThrow(req);
  const siteUrl = String(req.query.siteUrl || "");
  const start = String(req.query.start || "");
  const end = String(req.query.end || "");
  if (!siteUrl || !start || !end) {
    throw new Error("Missing siteUrl/start/end");
  }
  return gscQueryKeywords({ token, siteUrl, start, end });
}
