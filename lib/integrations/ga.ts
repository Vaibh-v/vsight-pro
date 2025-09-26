import type { NextApiRequest } from "next";
import type { DateRange } from "@/lib/contracts";
import {
  getAccessTokenOrThrow,
  listGA4Properties,
  ga4SessionsTimeseries,
} from "@/lib/google";

// Unified point shape the UI expects
export type TrafficPoint = { date: string; value: number };

/**
 * List GA4 properties for the signed-in user.
 * Pulls the Google OAuth access token from the request (NextAuth session)
 * and passes it to the low-level fetcher.
 */
export async function gaListProperties(req: NextApiRequest) {
  const token = await getAccessTokenOrThrow(req);
  return listGA4Properties(token);
}

/**
 * Fetch GA4 sessions time-series for a property and date range.
 * Converts `{date, sessions}` -> `{date, value}` for the chart.
 */
export async function getTrafficSeries(
  req: NextApiRequest,
  propertyId: string,
  range: DateRange
): Promise<{ points: TrafficPoint[]; total: number }> {
  const token = await getAccessTokenOrThrow(req);

  const { points, totalSessions } = await ga4SessionsTimeseries({
    token,
    propertyId,
    start: range.start,
    end: range.end,
  });

  const mapped: TrafficPoint[] = points.map((p: any) => ({
    date: p.date,
    value: typeof p.sessions === "number" ? p.sessions : Number(p.value ?? 0),
  }));

  return { points: mapped, total: totalSessions ?? 0 };
}
