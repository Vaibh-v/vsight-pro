import type { NextApiRequest } from "next";
import { getAccessTokenOrThrow, ga4SessionsTimeseries, listGA4Properties, type DateRange } from "@/lib/google";

/**
 * Returns GA4 properties (account-scoped) for the current user.
 * Expects Authorization: Bearer <token> on the request OR whatever your getAccessTokenOrThrow reads.
 */
export async function gaListProperties(req: NextApiRequest) {
  const token = await getAccessTokenOrThrow(req);
  return listGA4Properties(token);
}

/**
 * Returns a traffic timeseries (sessions) for a GA4 property within a date range.
 */
export async function getTrafficSeries(propertyId: string, range: DateRange): Promise<{ points: { date: string; value: number }[]; total: number }> {
  const token = await getAccessTokenOrThrow({ headers: {} } as any); // not used; kept for signature uniformity if you switch later
  const { points, totalSessions } = await ga4SessionsTimeseries({
    token,
    propertyId,
    range,
  });
  return {
    points: points.map(p => ({ date: p.date, value: p.sessions })),
    total: totalSessions,
  };
}

/**
 * Convenience wrapper that allows calling from API routes that already have the req at hand.
 * If you don’t need it, you can delete this and use the function above directly.
 */
export async function gaTrafficFromReq(req: NextApiRequest): Promise<{ points: { date: string; value: number }[]; total: number }> {
  const token = await getAccessTokenOrThrow(req);
  const { propertyId, start, end } = req.query as { propertyId?: string; start?: string; end?: string };
  if (!propertyId || !start || !end) throw new Error("Missing propertyId/start/end");
  const { points, totalSessions } = await ga4SessionsTimeseries({
    token,
    propertyId,
    range: { start, end },
  });
  return {
    points: points.map(p => ({ date: p.date, value: p.sessions })),
    total: totalSessions,
  };
}
