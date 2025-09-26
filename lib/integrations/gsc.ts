// lib/integrations/gsc.ts
// MVP stub for Google Search Console (GSC) so builds pass.
// Replace with real GSC queries once it's integrated.

import { getAccessTokenOrThrow } from "@/lib/google";
import type { DateRange, GscKeywordRow } from "@/lib/contracts";

// Stub: Query GSC for data, return empty set in v1. Replace with real data fetching in Sprint 2.
export async function gscQuery(
  _req: any, // Placeholder for actual request object
  _siteUrl: string,
  _start: string,
  _end: string
): Promise<GscKeywordRow[]> {
  return [];
}

// Stub: Get list of GSC sites, return empty set in v1. Replace with real data fetching in Sprint 2.
export async function listGscSites(_req: any): Promise<string[]> {
  return [];
}

// Stub: Get GSC insights (e.g., query performance)
export async function gscGetInsights(
  _req: any, 
  _siteUrl: string,
  _range: DateRange
): Promise<{ rows: GscKeywordRow[] }> {
  return { rows: [] };
}
