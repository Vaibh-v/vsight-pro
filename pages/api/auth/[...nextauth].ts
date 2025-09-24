import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
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
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account }) {
      // Persist Google access_token to the token right after login
      if (account?.access_token) token.google_access_token = account.access_token;
      return token;
    },
    async session({ session, token }) {
      // Expose token to client if you ever need it client-side
      (session as any).google_access_token = token.google_access_token;
      return session;
    }
  }
};

export default NextAuth(authOptions);
