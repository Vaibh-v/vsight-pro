import type { NextApiRequest } from "next";
import { getAccessTokenOrThrow, listGA4Properties, ga4SessionsTimeseries } from "@/lib/google";

export async function gaListProperties(req: NextApiRequest) {
  const token = getAccessTokenOrThrow(req);
  return listGA4Properties(token);
}

export type DateRange = { start: string; end: string };
export type TrafficPoint = { date: string; value: number };

export async function getTrafficSeries(propertyId: string, range: DateRange) {
  const token = getAccessTokenOrThrow(({} as unknown) as NextApiRequest); // not used here; keep API-only usage
  // ^ NOTE: do not call this directly on server components; use the API route wrapper below instead.
  return ga4SessionsTimeseries({ token, propertyId, start: range.start, end: range.end });
}

// Helper used only in API route:
export async function getTrafficSeriesFromReq(req: NextApiRequest, propertyId: string, range: DateRange) {
  const token = getAccessTokenOrThrow(req);
  return ga4SessionsTimeseries({ token, propertyId, start: range.start, end: range.end });
}
