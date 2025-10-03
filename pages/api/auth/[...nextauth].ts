import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "missing",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "missing"
    })
  ],
  secret: process.env.NEXTAUTH_SECRET || "dev-secret",
  session: { strategy: "jwt" }
});
