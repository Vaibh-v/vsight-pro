// /lib/integrations/gbp.ts
// Lean wrapper around our REST-based helper in /lib/google.ts
// No 'googleapis' or 'google-auth-library' needed.

import { getAccessTokenOrThrow, gbpInsights } from "@/lib/google";

// If your repo doesn't have these types, replace this with:
// type DateRange = { start: string; end: string };
// type GbpInsight = { date: string; calls: number; directions: number; websiteClicks: number; viewsSearch: number; viewsMaps: number };

import type { DateRange, GbpInsight } from "@/lib/contracts";

export async function getGbpInsights(
  locationId: string,
  range: DateRange
): Promise<GbpInsight[]> {
  const token = await getAccessTokenOrThrow();
  const rows = await gbpInsights({
    token,
    locationId,
    start: range.start,
    end: range.end,
  });
  // rows already normalized as {date, calls, directions, websiteClicks, viewsSearch, viewsMaps}
  return rows;
}
