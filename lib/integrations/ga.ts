import type { NextApiRequest } from "next";
import type { DateRange } from "@/lib/google";
import { listGA4Properties, ga4SessionsTimeseries } from "@/lib/google";

export async function gaListProperties(req: NextApiRequest) {
  return listGA4Properties(req);
}

export type TrafficPoint = { date: string; value: number };

export async function getTrafficSeries(
  req: NextApiRequest,
  propertyId: string,
  range: DateRange
): Promise<{ points: TrafficPoint[]; total: number }> {
  const { points, totalSessions } = await ga4SessionsTimeseries(req, propertyId, range);
  return { points, total: totalSessions };
}
