// pages/api/auth/[...nextauth].ts
import NextAuth from "next-auth";

export const authOptions = {
  providers: [],
  session: { strategy: "jwt" as const },
};
export default NextAuth(authOptions as any);
