import type { NextApiRequest } from "next";

export function isMockMode(): boolean {
  // We consider "no tokens/keys present" == mock mode for stability
  return false; // let providers decide based on their own config; keep here if you want a global mock toggle
}

export function readHeaderKey(req: NextApiRequest, name: string): string | undefined {
  const v = req.headers[name.toLowerCase()];
  if (!v) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

/**
 * We don't rely on googleapis SDK. For Google OAuth access tokens,
 * you can pass them via request headers from the client or use NextAuth session
 * on server (not implemented here deliberately to avoid build/runtime coupling).
 *
 * For stability: providers should NOT throw if token absent; they should mock.
 */
export async function getAccessTokenOrThrow(req: NextApiRequest, headerName = "x-access-token"): Promise<string> {
  const fromHeader = readHeaderKey(req, headerName);
  if (fromHeader) return fromHeader;
  // If you later wire NextAuth server session access token, add it here.
  throw new Error("Missing access token (header " + headerName + ").");
}
