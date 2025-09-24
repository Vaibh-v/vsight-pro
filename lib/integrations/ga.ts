// /lib/integrations/ga.ts
// Lightweight wrapper around our fetch-based GA4 helper.
// No 'googleapis' or 'google-auth-library' required.

import type { DateRange } from "@/lib/contracts"; // if this type doesn't exist in your repo, replace DateRange with `{ start: string; end: string }`
import { getAccessTokenOrThrow, ga4SessionsTimeseries } from "@/lib/google";

export type TrafficPoint = { date: string; sessions: number };

export async function getTrafficSeries(propertyId: string, range: DateRange): Promise<{ points: TrafficPoint[]; total: number }> {
  const token = await getAccessTokenOrThrow();
  const { points, totalSessions } = await ga4SessionsTimeseries({
    token,
    propertyId,
    start: range.start,
    end: range.end,
  });
  return {
    points: points.map(p => ({ date: p.date, sessions: p.sessions })),
    total: totalSessions,
  };
}
