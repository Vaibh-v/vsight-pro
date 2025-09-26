// lib/integrations/ga.ts
import type { NextApiRequest } from "next";
import type { DateRange } from "@/lib/google";
import {
  getAccessTokenOrThrow,
  listGA4Properties,
  ga4SessionsTimeseries,
} from "@/lib/google";

export async function gaListProperties(req: NextApiRequest) {
  const token = getAccessTokenOrThrow(req);
  return listGA4Properties(token);
}

export type TrafficPoint = { date: string; value: number };

export async function getTrafficSeries(
  propertyId: string,
  range: DateRange
): Promise<{ points: TrafficPoint[]; total: number }> {
  // Replace "stub" with a real token if you wire server-to-server
  const token = "stub";
  const { points, totalSessions } = await ga4SessionsTimeseries({
    token,
    propertyId,
    range,
  });
  return {
    points: points.map((p) => ({ date: p.date, value: p.value })),
    total: totalSessions,
  };
}
