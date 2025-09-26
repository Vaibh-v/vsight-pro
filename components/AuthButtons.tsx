// components/AuthButtons.tsx
import * as React from "react";

let real: { signIn?: any; signOut?: any; useSession?: any } = {};
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  real = require("next-auth/react");
} catch {}

export default function AuthButtons() {
  const SessionHook = real.useSession || (() => ({ status: "unauthenticated" }));
  const { status } = SessionHook();
  const signedIn = status === "authenticated";

  const onSignIn = () => (real.signIn ? real.signIn() : alert("Sign-in not configured"));
  const onSignOut = () => (real.signOut ? real.signOut() : alert("Sign-out not configured"));

  return (
    <div className="flex gap-2">
      {!signedIn ? (
        <button className="border rounded px-3 py-1" onClick={onSignIn}>Sign in</button>
      ) : (
        <button className="border rounded px-3 py-1" onClick={onSignOut}>Sign out</button>
      )}
    </div>
  );
}
