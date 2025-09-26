// GBP stub (wire later)
import type { NextApiRequest } from "next";
import type { DateRange } from "@/lib/contracts";

export type GbpLocation = { locationId: string; name: string };
export type GbpInsight = { date: string; calls?: number; directions?: number; websiteClicks?: number };

export async function gbpListLocations(_req: NextApiRequest): Promise<GbpLocation[]> {
  return [];
}
export async function gbpGetInsights(_req: NextApiRequest, _locationId: string, _range: DateRange) {
  return { rows: [] as GbpInsight[] };
}
