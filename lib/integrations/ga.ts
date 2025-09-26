import type { NextApiRequest } from "next";
import type { DateRange } from "@/lib/contracts"; // if absent: export type DateRange = { start: string; end: string };
import { ga4SessionsTimeseries, listGA4Properties } from "@/lib/google";

export type TrafficPoint = { date: string; sessions: number };

export async function gaListProperties(req: NextApiRequest) {
  return listGA4Properties(req);
}

export async function getTrafficSeries(
  req: NextApiRequest,
  propertyId: string,
  range: DateRange
): Promise<{ points: TrafficPoint[]; total: number }> {
  const { points, totalSessions } = await ga4SessionsTimeseries(req, propertyId, range.start, range.end);
  return { points, total: totalSessions };
}
