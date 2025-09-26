// lib/integrations/gbp.ts
// MVP stub for Google Business Profile (GBP) so builds pass.
// Replace with real calls once GBP (v1.1) is enabled.

import type { NextApiRequest } from "next";

// If your repo doesn't have DateRange, uncomment the line below:
// export type DateRange = { start: string; end: string };
import type { DateRange } from "@/lib/contracts";

export type GbpInsight = {
  date: string;
  viewsSearch?: number;
  viewsMaps?: number;
  calls?: number;
  directions?: number;
  websiteClicks?: number;
  topQueries?: string[];
};

export type GbpLocation = {
  locationId: string;
  name: string;
  lat?: number;
  lng?: number;
  address?: string;
  primaryCategory?: string;
};

/**
 * Stub: list user's GBP locations.
 * Returns an empty array in v1 to keep UI stable.
 */
export async function gbpListLocations(
  _req: NextApiRequest
): Promise<GbpLocation[]> {
  return [];
}

/**
 * Stub: daily insights for a GBP location within a date range.
 * Returns an empty set in v1. Wire real data in Sprint 2.
 */
export async function gbpGetInsights(
  _req: NextApiRequest,
  _locationId: string,
  _range: DateRange
): Promise<{ rows: GbpInsight[] }> {
  return { rows: [] };
}
