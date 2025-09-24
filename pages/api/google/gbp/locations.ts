import type { NextApiRequest, NextApiResponse } from "next";
// For v1.1 you’ll implement list calls via Business Profile API.
// Keeping a placeholder endpoint so the UI can wire up later.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ items: [] });
}
