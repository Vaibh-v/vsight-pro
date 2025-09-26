// lib/integrations/ga.ts
// Thin wrappers for GA-related operations used by API routes or server code.

import type { NextApiRequest } from "next";
import {
  getAccessTokenOrThrow,
  listGA4Properties as _listGA4Properties,
  ga4SessionsTimeseries,
  type DateRange,
} from "@/lib/google";

/**
 * List GA4 properties visible to the signed-in user.
 * Delegates to lib/google.ts which reads the access token from NextAuth.
 */
export async function gaListProperties(req: NextApiRequest) {
  return _listGA4Properties(req);
}

/**
 * Fetch sessions timeseries for a property and date range.
 * Normalizes the return shape to { points, total } which matches the app’s usage.
 */
export async function getTrafficSeries(
  req: NextApiRequest,
  propertyId: string,
  range: DateRange
): Promise<{ points: { date: string; value: number }[]; total: number }> {
  const token = await getAccessTokenOrThrow(req);
  const { points, totalSessions } = await ga4SessionsTimeseries({
    token,
    propertyId,
    range,
  });
  return { points, total: totalSessions };
}
