import React, { useEffect, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";

type GAProp = { propertyId: string; displayName: string };
type GSCSite = { siteUrl: string; permissionLevel: string };

const today = new Date();
const d = (dt: Date) => dt.toISOString().slice(0, 10);
const aWeekAgo = new Date(today.getTime() - 6 * 86400_000);

export default function Home() {
  const { data: session, status } = useSession();
  const loading = status === "loading";

  const [gaProps, setGaProps] = useState<GAProp[]>([]);
  const [gscSites, setGscSites] = useState<GSCSite[]>([]);

  const [gaPropertyId, setGaPropertyId] = useState("");
  const [gscSiteUrl, setGscSiteUrl] = useState("");

  const [start, setStart] = useState(d(aWeekAgo));
  const [end, setEnd] = useState(d(today));

  const [output, setOutput] = useState<any>(null);

  useEffect(() => {
    if (!session) return;
    (async () => {
      try {
        const [pRes, sRes] = await Promise.all([
          fetch("/api/ga/properties"),
          fetch("/api/gsc/sites"),
        ]);
        const p = await pRes.json();
        const s = await sRes.json();
        setGaProps(p.properties ?? []);
        setGscSites(s.sites ?? []);
        if (!gaPropertyId && p.properties?.[0]) setGaPropertyId(p.properties[0].propertyId);
        if (!gscSiteUrl && s.sites?.[0]) setGscSiteUrl(s.sites[0].siteUrl);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [session]);

  const runGa = async () => {
    setOutput({ loading: true });
    const res = await fetch("/api/ga/traffic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId: gaPropertyId, start, end }),
    });
    setOutput(await res.json());
  };

  const runGsc = async () => {
    setOutput({ loading: true });
    const res = await fetch("/api/gsc/keywords", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteUrl: gscSiteUrl, start, end }),
    });
    setOutput(await res.json());
  };

  return (
    <div style={{ maxWidth: 1000, margin: "40px auto", padding: 16, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Inter, sans-serif" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>VSight Pro — MVP Shell</h1>
      <p style={{ color: "#555", marginBottom: 24 }}>GA traffic · GSC keywords · (GBP coming soon)</p>

      <section style={{ border: "1px solid #eee", borderRadius: 8, padding: 16, marginBottom: 20 }}>
        <h3 style={{ margin: 0, marginBottom: 12 }}>Auth</h3>
        {loading ? (
          <p>Loading session…</p>
        ) : session ? (
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span>Signed in as <b>{session.user?.email}</b></span>
            <button onClick={() => signOut()} style={{ padding: "6px 10px", border: "1px solid #ddd", borderRadius: 6 }}>Sign out</button>
          </div>
        ) : (
          <button onClick={() => signIn("google")} style={{ padding: "8px 12px", background: "black", color: "white", borderRadius: 6 }}>
            Sign in with Google
          </button>
        )}
      </section>

      {session && (
        <>
          <section style={{ border: "1px solid #eee", borderRadius: 8, padding: 16, marginBottom: 20 }}>
            <h3 style={{ margin: 0, marginBottom: 12 }}>Inputs</h3>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <label>GA4 Property</label>
              <select value={gaPropertyId} onChange={(e) => setGaPropertyId(e.target.value)}>
                {gaProps.map((p) => (
                  <option key={p.propertyId} value={p.propertyId}>
                    {p.displayName} ({p.propertyId})
                  </option>
                ))}
              </select>

              <label>GSC Site</label>
              <select style={{ minWidth: 360 }} value={gscSiteUrl} onChange={(e) => setGscSiteUrl(e.target.value)}>
                {gscSites.map((s) => (
                  <option key={s.siteUrl} value={s.siteUrl}>
                    {s.siteUrl} — {s.permissionLevel}
                  </option>
                ))}
              </select>

              <label>Start</label>
              <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
              <label>End</label>
              <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </section>

          <section style={{ border: "1px solid #eee", borderRadius: 8, padding: 16 }}>
            <h3 style={{ margin: 0, marginBottom: 12 }}>Test Calls (last 7 days)</h3>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <button onClick={runGa} style={{ padding: "6px 10px", borderRadius: 16, border: "1px solid #ddd" }}>GA: traffic</button>
              <button onClick={runGsc} style={{ padding: "6px 10px", borderRadius: 16, border: "1px solid #ddd" }}>GSC: keywords</button>
            </div>

            <pre style={{ background: "#fafafa", border: "1px solid #eee", borderRadius: 8, padding: 16, whiteSpace: "pre-wrap" }}>
              {JSON.stringify(output ?? {}, null, 2)}
            </pre>
          </section>
        </>
      )}
    </div>
  );
}
