import { signIn, signOut, useSession } from "next-auth/react";

export default function AuthButtons() {
  const { status } = useSession();
  if (status === "loading") return <span>Loading session…</span>;
  return status === "authenticated" ? (
    <button onClick={() => signOut()} className="underline">Sign out</button>
  ) : (
    <button onClick={() => signIn("google")} className="underline">Sign in with Google</button>
  );
}
