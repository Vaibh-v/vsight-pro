// pages/api/gbp/insights.ts
import type { NextApiRequest, NextApiResponse } from "next";
// Temporary stub: return static GBP insights so the app builds & the button works.
export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse
) {
  res.status(200).json({
    rows: [
      {
        date: "2025-09-15",
        viewsSearch: 220,
        viewsMaps: 180,
        calls: 5,
        directions: 9,
        websiteClicks: 14,
        topQueries: ["plumber", "emergency plumber", "leak repair"],
      },
      {
        date: "2025-09-22",
        viewsSearch: 260,
        viewsMaps: 210,
        calls: 7,
        directions: 12,
        websiteClicks: 17,
        topQueries: ["plumber", "water heater", "pipe burst"],
      },
    ],
  });
}
