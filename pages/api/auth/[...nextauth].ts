import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
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
  // IMPORTANT: type the literal, not just string
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account }) {
      if (account?.access_token) token.google_access_token = account.access_token;
      return token;
    },
    async session({ session, token }) {
      (session as any).google_access_token = (token as any)?.google_access_token;
      return session;
    }
  }
};

export default NextAuth(authOptions);
