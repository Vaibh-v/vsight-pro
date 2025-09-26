import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Temporary stub for Google Business Profile insights.
 * We return an empty list so the UI can render without errors.
 * Replace with a real implementation once GBP is wired up.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).end();
  }

  return res.status(200).json({
    items: [],
    note: "GBP insights not implemented yet.",
  });
}
