import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/analytics.readonly",
            "https://www.googleapis.com/auth/webmasters.readonly"
          ].join(" ")
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = (account as any).access_token;
        token.refreshToken = (account as any).refresh_token;
        const exp = (account as any).expires_at; // seconds since epoch
        // Fallback: 1h from now if Google didn't return expires_at
        token.accessTokenExpires =
          (typeof exp === "number" ? exp * 1000 : Date.now() + 3600 * 1000);
      }
      // if token exists & not expired, return as-is
      if (token.accessToken && Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }
      // NOTE: To keep this MVP simple, we don't implement refresh here.
      // If expired, let routes fail with 401 so the user can re-login.
      return token;
    },
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken;
      return session;
    }
  },
  pages: {
    signIn: "/"
  },
  secret: process.env.NEXTAUTH_SECRET
};

export default NextAuth(authOptions);
