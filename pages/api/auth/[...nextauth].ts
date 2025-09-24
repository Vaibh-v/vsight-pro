import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import type { JWT } from "next-auth/jwt";

const GOOGLE_AUTHORIZATION_URL =
  "https://accounts.google.com/o/oauth2/v2/auth?" +
  new URLSearchParams({
    prompt: "consent",
    access_type: "offline",
    response_type: "code",
  });

type ExtendedToken = JWT & {
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpires?: number; // epoch ms
  error?: "RefreshAccessTokenError";
};

async function refreshAccessToken(token: ExtendedToken): Promise<ExtendedToken> {
  try {
    if (!token.refreshToken) throw new Error("Missing refresh token");

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error_description || "Refresh failed");

    const expiresInSec =
      typeof data.expires_in === "number"
        ? data.expires_in
        : Number.parseInt(String(data.expires_in ?? "3600"), 10) || 3600;

    return {
      ...token,
      accessToken: data.access_token as string,
      accessTokenExpires: Date.now() + expiresInSec * 1000,
      // Google sometimes doesn't return a new refresh token; keep the old one
      refreshToken: (data.refresh_token as string | undefined) ?? token.refreshToken,
      error: undefined,
    };
  } catch {
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        url: GOOGLE_AUTHORIZATION_URL,
        params: {
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/analytics.readonly",
            "https://www.googleapis.com/auth/webmasters.readonly",
            // Enable later when GBP tile ships:
            // "https://www.googleapis.com/auth/business.manage",
          ].join(" "),
        },
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account }) {
      const t = token as ExtendedToken;

      // Initial sign-in
      if (account) {
        t.accessToken = account.access_token as string | undefined;
        t.refreshToken = account.refresh_token as string | undefined;

        const expiresInSec =
          typeof account.expires_in === "number"
            ? account.expires_in
            : Number.parseInt(String(account.expires_in ?? "3600"), 10) || 3600;

        // NOTE: the original error came from a malformed '??' sequence; this is safe and typed.
        t.accessTokenExpires = Date.now() + expiresInSec * 1000;
        return t;
      }

      // If token is still valid, return it
      if (t.accessToken && typeof t.accessTokenExpires === "number" && Date.now() < t.accessTokenExpires) {
        return t;
      }

      // Otherwise, refresh it
      return await refreshAccessToken(t);
    },

    async session({ session, token }) {
      const t = token as ExtendedToken;
      (session as any).accessToken = t.accessToken;
      (session as any).error = t.error;
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
};

export default NextAuth(authOptions);
