import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const scopes = process.env.GOOGLE_SCOPES ??
  [
    "https://www.googleapis.com/auth/analytics.readonly",
    "https://www.googleapis.com/auth/webmasters.readonly",
    "https://www.googleapis.com/auth/business.manage",
    "openid",
    "email",
    "profile",
  ].join(" ");

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: scopes,
          // ensure refresh_token:
          prompt: "consent",
          access_type: "offline",
          include_granted_scopes: "true",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.access_token = account.access_token;
        token.refresh_token = account.refresh_token ?? token.refresh_token;
        token.expires_at =
          (account.expires_at ?? 0) * 1000 || Date.now() + 55 * 60 * 1000;
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).access_token = token.access_token;
      (session as any).refresh_token = token.refresh_token;
      (session as any).expires_at = token.expires_at;
      return session;
    },
  },
  session: { strategy: "jwt" },
});
