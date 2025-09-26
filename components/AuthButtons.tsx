import { signIn, signOut, useSession } from "next-auth/react";

export default function AuthButtons() {
  const { status } = useSession();

  if (status === "loading") {
    return <button className="px-3 py-1 rounded border">Loading…</button>;
  }

  if (status === "authenticated") {
    return (
      <button
        className="px-3 py-1 rounded border"
        onClick={() => signOut()}
      >
        Sign out
      </button>
    );
  }

  return (
    <button
      className="px-3 py-1 rounded border"
      onClick={() => signIn("google")}
    >
      Sign in with Google
    </button>
  );
}
