import type { NextApiRequest } from "next";
import { getToken } from "next-auth/jwt";

export async function requireGoogleAccessToken(req: NextApiRequest): Promise<string> {
  const token = await getToken({ req });
  const at = (token as any)?.access_token as string | undefined;
  if (!at) throw new Error("No Google access token. Please sign in.");
  return at;
}
