import { useSession, signIn, signOut } from "next-auth/react";
import { useState } from "react";

export default function Home() {
  const { data: session, status } = useSession();
  const loading = status === "loading";
  const [out, setOut] = useState<any>(null);

  async function call(path: string, params: Record<string,string>) {
    const qs = new URLSearchParams(params).toString();
    const r = await fetch(`${path}?${qs}`);
    const j = await r.json();
    setOut(j);
  }

  const today = new Date();
  const end = today.toISOString().slice(0,10);
  const start = new Date(today.getTime() - 7*86400000).toISOString().slice(0,10);

  return (
    <main style={{ maxWidth: 900, margin: "48px auto", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>VSight Pro — MVP Shell</h1>
      <p style={{ color: "#666" }}>GA traffic • GSC keywords • GBP insights (stubbed until keys wired)</p>

      <section style={{ marginTop: 20, padding: 16, border: "1px solid #eee", borderRadius: 12 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Auth</h2>
        {loading ? <p>Loading…</p> : session ? (
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span>Signed in as <strong>{session.user?.email}</strong></span>
            <button onClick={() => signOut()} style={{ padding: "6px 10px", borderRadius: 8, background: "#eee" }}>Sign out</button>
          </div>
        ) : (
          <button onClick={() => signIn("google")} style={{ padding: "6px 10px", borderRadius: 8, background: "#000", color: "#fff" }}>
            Sign in with Google
          </button>
        )}
      </section>

      <section style={{ marginTop: 20, padding: 16, border: "1px solid #eee", borderRadius: 12 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Test Calls (last 7 days)</h2>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={() => call("/api/ga/traffic", { start, end })} disabled={!session}
                  style={{ padding: "8px 12px", borderRadius: 8, background: session ? "#0a7" : "#ccc", color: "#fff" }}>
            GA: traffic
          </button>
          <button onClick={() => call("/api/gsc/keywords", { start, end, country: "ALL" })} disabled={!session}
                  style={{ padding: "8px 12px", borderRadius: 8, background: session ? "#07a" : "#ccc", color: "#fff" }}>
            GSC: keywords
          </button>
          <button onClick={() => call("/api/gbp/insights", { start, end })} disabled={!session}
                  style={{ padding: "8px 12px", borderRadius: 8, background: session ? "#a70" : "#ccc", color: "#fff" }}>
            GBP: insights
          </button>
        </div>

        <pre style={{ marginTop: 12, padding: 12, background: "#fafafa", borderRadius: 8, whiteSpace: "pre-wrap" }}>
{out ? JSON.stringify(out, null, 2) : "← click a button"}
        </pre>
      </section>
    </main>
  );
}
