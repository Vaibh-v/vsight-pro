// lib/integrations/ga.ts
import type { NextApiRequest } from "next";
import type { DateRange } from "@/lib/contracts"; // if missing, use: type DateRange = { start: string; end: string };
import { ga4SessionsTimeseries, listGA4Properties } from "@/lib/google";

export type TrafficPoint = { date: string; sessions: number };

/** GA4: list properties (id + name) for the signed-in user */
export async function gaListProperties(
  req: NextApiRequest
): Promise<Array<{ id: string; name: string }>> {
  return listGA4Properties(req);
}

/** GA4: sessions time-series for charts */
export async function getTrafficSeries(
  req: NextApiRequest,
  propertyId: string,
  range: DateRange
): Promise<{ points: TrafficPoint[]; total: number }> {
  const { points, totalSessions } = await ga4SessionsTimeseries(
    req,
    propertyId,
    range.start,
    range.end
  );
  // points already shaped as { date, sessions }
  return { points, total: totalSessions };
}
