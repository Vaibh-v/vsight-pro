// pages/index.tsx
import { useEffect, useMemo, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";

export default function Home() {
  const { data: session, status } = useSession();
  const authed = status === "authenticated";

  const [gaProps, setGaProps] = useState<string[]>([]);
  const [gaPropertyId, setGaPropertyId] = useState<string>("");

  const [gscSites, setGscSites] = useState<string[]>([]);
  const [gscSite, setGscSite] = useState<string>("");

  const today = useMemo(() => new Date(), []);
  const sevenAgo = useMemo(() => new Date(Date.now() - 7 * 86400 * 1000), []);
  const [start, setStart] = useState<string>(fmt(sevenAgo));
  const [end, setEnd] = useState<string>(fmt(today));

  const [output, setOutput] = useState<any>({});

  useEffect(() => {
    if (!authed) return;
    // GA properties
    fetch("/api/google/ga4/properties")
      .then((r) => r.json())
      .then((d) => {
        const list: string[] = d.properties ?? [];
        setGaProps(list);
        if (!gaPropertyId && list.length) setGaPropertyId(list[0]);
      })
      .catch(() => {});
    // GSC sites
    fetch("/api/google/gsc/sites")
      .then((r) => r.json())
      .then((d) => {
        const list: string[] = d.sites ?? [];
        setGscSites(list);
        if (!gscSite && list.length) setGscSite(list[0]);
      })
      .catch(() => {});
  }, [authed]);

  const runGa = async () => {
    setOutput({});
    const url = `/api/ga/traffic?propertyId=${encodeURIComponent(
      gaPropertyId
    )}&start=${start}&end=${end}`;
    const data = await fetch(url).then((r) => r.json());
    setOutput(data);
  };

  const runGsc = async () => {
    setOutput({});
    const url = `/api/google/gsc/query?siteUrl=${encodeURIComponent(
      gscSite
    )}&start=${start}&end=${end}`;
    const data = await fetch(url).then((r) => r.json());
    setOutput(data);
  };

  return (
    <main className="container" style={{ maxWidth: 920, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>VSight Pro — MVP Shell</h1>
      <p style={{ color: "#555", marginBottom: 24 }}>GA traffic · GSC keywords</p>

      {/* Auth */}
      <section style={{ border: "1px solid #eee", borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <h3>Auth</h3>
        {authed ? (
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span>Signed in as <strong>{session?.user?.email}</strong></span>
            <button onClick={() => signOut()}>Sign out</button>
          </div>
        ) : (
          <button onClick={() => signIn("google")}>Sign in with Google</button>
        )}
      </section>

      {/* Inputs */}
      <section style={{ border: "1px solid #eee", borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <h3>Inputs</h3>

        <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", rowGap: 8, columnGap: 12 }}>
          <label style={{ alignSelf: "center" }}>GA4 Property</label>
          <select value={gaPropertyId} onChange={(e) => setGaPropertyId(e.target.value)}>
            {gaProps.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <label style={{ alignSelf: "center" }}>GSC Site</label>
          <select value={gscSite} onChange={(e) => setGscSite(e.target.value)}>
            {gscSites.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <label style={{ alignSelf: "center" }}>Start</label>
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />

          <label style={{ alignSelf: "center" }}>End</label>
          <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
      </section>

      {/* Tests */}
      <section style={{ border: "1px solid #eee", borderRadius: 8, padding: 16 }}>
        <h3>Test Calls (last 7 days)</h3>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button onClick={runGa}>GA: traffic</button>
          <button onClick={runGsc}>GSC: keywords</button>
        </div>
        <pre style={{ background: "#fafafa", padding: 16, overflow: "auto", borderRadius: 6 }}>
          {JSON.stringify(output, null, 2)}
        </pre>
      </section>
    </main>
  );
}

function fmt(d: Date) {
  // yyyy-mm-dd for <input type="date">
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
