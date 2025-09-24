import type { NextApiRequest, NextApiResponse } from "next";
import { getAccessTokenOrThrow, gscQuery } from "@/lib/google";
import { z } from "zod";

const BodySchema = z.object({
  gscSiteUrl: z.string().optional(),
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  country: z.string().optional(), // ALL default
});

type InsightCard = {
  id: string;
  type: "TOP_COVERAGE" | "MOVER";
  severity: "info" | "warn" | "action";
  period: { start: string; end: string };
  payload: any;
};

function dateDiffDays(start: string, end: string) {
  return (new Date(end).getTime() - new Date(start).getTime()) / 86400000;
}
function shiftBack(start: string, end: string) {
  const days = dateDiffDays(start, end);
  const s = new Date(start); s.setDate(s.getDate() - days - 1);
  const e = new Date(end);   e.setDate(e.getDate() - days - 1);
  const toStr = (d: Date) => d.toISOString().slice(0,10);
  return { prevStart: toStr(s), prevEnd: toStr(e) };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  try {
    const token = await getAccessTokenOrThrow();
    const body = BodySchema.parse(req.body);
    const country = body.country ?? "ALL";

    const items: InsightCard[] = [];

    if (body.gscSiteUrl) {
      // Current window
      const curr = await gscQuery({
        token,
        siteUrl: body.gscSiteUrl,
        start: body.start,
        end: body.end,
        country,
      });

      // Coverage counts (based on latest day’s position per {query,page,country})
      const latestByKey = new Map<string, any>();
      for (const r of curr) {
        const key = [r.query, r.page, r.country ?? "ALL"].join("|");
        // Keep last occurrence (dates ascend vaguely; we’ll just override)
        latestByKey.set(key, r);
      }
      let top3 = 0, top10 = 0, top50 = 0;
      for (const r of latestByKey.values()) {
        const pos = Number(r.position ?? 0);
        if (pos <= 50) top50++;
        if (pos <= 10) top10++;
        if (pos <= 3) top3++;
      }

      // Previous window for deltas
      const { prevStart, prevEnd } = shiftBack(body.start, body.end);
      const prev = await gscQuery({
        token,
        siteUrl: body.gscSiteUrl,
        start: prevStart,
        end: prevEnd,
        country,
      });
      const prevLatest = new Map<string, any>();
      for (const r of prev) {
        const key = [r.query, r.page, r.country ?? "ALL"].join("|");
        prevLatest.set(key, r);
      }
      let p3 = 0, p10 = 0, p50 = 0;
      for (const r of prevLatest.values()) {
        const pos = Number(r.position ?? 0);
        if (pos <= 50) p50++;
        if (pos <= 10) p10++;
        if (pos <= 3) p3++;
      }

      items.push({
        id: "coverage",
        type: "TOP_COVERAGE",
        severity: "info",
        period: { start: body.start, end: body.end },
        payload: {
          top3, top10, top50,
          deltaTop3: top3 - p3,
          deltaTop10: top10 - p10,
          deltaTop50: top50 - p50,
        },
      });

      // Movers (click deltas by query)
      const sumClicks = (rows: any[]) => {
        const map = new Map<string, number>();
        for (const r of rows) {
          map.set(r.query, (map.get(r.query) ?? 0) + Number(r.clicks ?? 0));
        }
        return map;
      };
      const currClicks = sumClicks(curr);
      const prevClicks = sumClicks(prev);

      const deltas: { query: string; delta: number }[] = [];
      for (const [q, v] of currClicks) {
        const d = v - (prevClicks.get(q) ?? 0);
        if (d !== 0) deltas.push({ query: q, delta: d });
      }
      // Add queries that disappeared
      for (const [q, v] of prevClicks) {
        if (!currClicks.has(q)) deltas.push({ query: q, delta: -v });
      }
      deltas.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

      items.push({
        id: "movers",
        type: "MOVER",
        severity: "info",
        period: { start: body.start, end: body.end },
        payload: {
          topGainers: deltas.filter(d => d.delta > 0).slice(0, 10),
          topLosers: deltas.filter(d => d.delta < 0).slice(0, 10),
        },
      });
    }

    res.status(200).json({ items });
  } catch (e: any) {
    res.status(e.status || 500).json({ error: e.message || "Insights compute failed" });
  }
}
