// Minimal GSC integration (list sites; keywords later)
import type { NextApiRequest } from "next";
import type { DateRange } from "@/lib/contracts";
import { listGscSites as _list } from "@/lib/google";

export type GscSite = { siteUrl: string; permissionLevel: string };
export type GscKeywordRow = {
  date?: string;
  query?: string;
  page?: string;
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
  country?: string;
};

export async function listGscSites(req: NextApiRequest): Promise<GscSite[]> {
  return _list(req);
}

// Stub for keywords (returns empty for now)
export async function gscQueryKeywords(
  _req: NextApiRequest,
  _siteUrl: string,
  _start: string,
  _end: string
): Promise<GscKeywordRow[]> {
  return [];
}
