import * as React from "react";
import { useSession, signIn, signOut } from "next-auth/react";

export default function Header() {
  const { status, data } = useSession();
  return (
    <header className="flex items-center justify-between">
      <h1 className="text-xl font-semibold">VSight Pro</h1>
      <div className="flex items-center gap-3">
        {status === "authenticated" ? (
          <>
            <span className="text-sm text-gray-600">
              {data?.user?.email ?? "Signed in"}
            </span>
            <button
              onClick={() => signOut()}
              className="text-sm border rounded px-3 py-1 hover:bg-gray-50"
            >
              Sign out
            </button>
          </>
        ) : (
          <button
            onClick={() => signIn("google")}
            className="text-sm border rounded px-3 py-1 hover:bg-gray-50"
          >
            Sign in with Google
          </button>
        )}
      </div>
    </header>
  );
}
