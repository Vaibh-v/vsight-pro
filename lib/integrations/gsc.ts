// lib/integrations/gsc.ts
// Thin wrappers over lib/google to keep import names stable across the app.

import type { NextApiRequest } from "next";
import {
  gscListSites as _gscListSites,
  gscQueryKeywords as _gscQueryKeywords,
  type DateRange, // exported for consumers that reference it
} from "@/lib/google";

export type { DateRange } from "@/lib/google";

export async function gscListSites(req: NextApiRequest) {
  return _gscListSites(req);
}

// Provide a stable name used by API routes/pages.
export async function gscQueryKeywords(
  req: NextApiRequest,
  params?: { siteUrl?: string; start?: string; end?: string }
) {
  return _gscQueryKeywords(req, params);
}
