import { useEffect, useMemo, useState } from "react";

type GAProperty = { id: string; displayName: string; account: string };
type GSite = { siteUrl: string; permissionLevel: string };

export default function Home() {
  const [gaProps, setGaProps] = useState<GAProperty[]>([]);
  const [gscSites, setGscSites] = useState<GSite[]>([]);
  const [gaSelected, setGaSelected] = useState<string>(process.env.DEFAULT_GA4_PROPERTY ?? "");
  const [gscSelected, setGscSelected] = useState<string>(process.env.DEFAULT_GSC_SITE ?? "");
  const [start, setStart] = useState<string>(() => new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10));
  const [end, setEnd] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [out, setOut] = useState<any>({});

  useEffect(() => {
    (async () => {
      try {
        const [gaRes, gscRes] = await Promise.all([
          fetch("/api/google/ga4/properties"),
          fetch("/api/google/gsc/sites")
        ]);

        const gaJson = await gaRes.json();
        const gscJson = await gscRes.json();

        if (gaRes.ok) {
          setGaProps(gaJson.properties ?? []);
          if (!gaSelected && gaJson.properties?.[0]?.id) setGaSelected(gaJson.properties[0].id);
        } else {
          setOut((o: any) => ({ ...o, gaPropsError: gaJson }));
        }

        if (gscRes.ok) {
          setGscSites(gscJson.siteEntries ?? []);
          if (!gscSelected && gscJson.siteEntries?.[0]?.siteUrl) setGscSelected(gscJson.siteEntries[0].siteUrl);
        } else {
          setOut((o: any) => ({ ...o, gscSitesError: gscJson }));
        }
      } catch (e: any) {
        setOut({ error: e?.message ?? String(e) });
      }
    })();
  }, []); // load once

  const gaOptions = useMemo(
    () =>
      gaProps.map((p) => ({
        value: p.id,
        label: p.displayName ? `${p.displayName} (${p.id.replace("properties/", "")})` : p.id
      })),
    [gaProps]
  );

  const runGATraffic = async () => {
    if (!gaSelected) return setOut({ error: "Select a GA4 property" });
    const propertyId = gaSelected.startsWith("properties/") ? gaSelected : `properties/${gaSelected}`;
    const url = `/api/ga/traffic?propertyId=${encodeURIComponent(propertyId)}&start=${start}&end=${end}`;
    const r = await fetch(url);
    setOut(await r.json());
  };

  const runGSCKeywords = async () => {
    if (!gscSelected) return setOut({ error: "Select a GSC site" });
    const url = `/api/google/gsc/keywords?siteUrl=${encodeURIComponent(gscSelected)}&start=${start}&end=${end}`;
    const r = await fetch(url, { method: "POST" });
    setOut(await r.json());
  };

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <h1>VSight Pro — MVP Shell</h1>
      <p style={{ color: "#666" }}>GA traffic · GSC keywords</p>

      <section style={{ border: "1px solid #eee", padding: 16, borderRadius: 8, marginTop: 16 }}>
        <h3>Inputs</h3>
        <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 8, alignItems: "center" }}>
          <label>GA4 Property</label>
          <select value={gaSelected} onChange={(e) => setGaSelected(e.target.value)} disabled={!gaOptions.length}>
            {!gaOptions.length && <option value="">(loading…)</option>}
            {gaOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <label>GSC Site</label>
          <select value={gscSelected} onChange={(e) => setGscSelected(e.target.value)} disabled={!gscSites.length}>
            {!gscSites.length && <option value="">(loading…)</option>}
            {gscSites.map((s) => (
              <option key={s.siteUrl} value={s.siteUrl}>
                {s.siteUrl} {s.permissionLevel ? `(${s.permissionLevel})` : ""}
              </option>
            ))}
          </select>

          <label>Start</label>
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          <label>End</label>
          <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
      </section>

      <section style={{ border: "1px solid #eee", padding: 16, borderRadius: 8, marginTop: 16 }}>
        <h3>Test Calls (last 7 days)</h3>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button onClick={runGATraffic}>GA: traffic</button>
          <button onClick={runGSCKeywords}>GSC: keywords</button>
        </div>

        <pre style={{ background: "#fafafa", padding: 16, borderRadius: 8, overflow: "auto" }}>
{JSON.stringify(out, null, 2)}
        </pre>
      </section>
    </main>
  );
}
