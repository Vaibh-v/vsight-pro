import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { assembleDashboard } from "@/lib/merge";
import { heuristicInsights } from "@/lib/ai";
import * as GA4 from "@/lib/providers/ga4";
import * as GSC from "@/lib/providers/gsc";
import * as GBP from "@/lib/providers/gbp";
import { DateRange } from "@/lib/contracts";

const Q = z.object({
  ga4: z.string().optional(),
  gsc: z.string().optional(),
  gbp: z.string().optional(),
  rangeStart: z.string().min(10),
  rangeEnd: z.string().min(10)
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { ga4, gsc, gbp, rangeStart, rangeEnd } = Q.parse(req.query);
    const range: DateRange = { start: rangeStart, end: rangeEnd };

    const bundles = await Promise.all([
      ga4 ? GA4.fetchTimeseries({ resourceId: ga4, range }) : Promise.resolve({}),
      gsc ? GSC.fetchTimeseries({ resourceId: gsc, range }) : Promise.resolve({}),
      gbp ? GBP.fetchTimeseries({ resourceId: gbp, range }) : Promise.resolve({})
    ]);

    const data = assembleDashboard(...bundles);
    res.status(200).json(heuristicInsights(data));
  } catch (e: any) {
    res.status(200).json({ items: [{ title: "No data", body: "Connect a provider.", severity: "info" as const }] });
  }
}
