import * as React from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { DateRange } from "@/components/DateRange";
import { Dropdown, type Option } from "@/components/Dropdown";
import { Sparkline } from "@/components/Chart";
import { InsightsCards, type InsightCard } from "@/components/InsightsCards";

function todayMinus(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

export default function Home() {
  const { data: session, status } = useSession();
  const [start, setStart] = React.useState(todayMinus(28));
  const [end, setEnd] = React.useState(todayMinus(1));

  const [ga4Options, setGa4Options] = React.useState<Option[]>([]);
  const [gscOptions, setGscOptions] = React.useState<Option[]>([]);
  const [ga4PropertyId, setGa4PropertyId] = React.useState<string>("");
  const [gscSiteUrl, setGscSiteUrl] = React.useState<string>("");

  const [traffic, setTraffic] = React.useState<Array<{ date: string; value: number }>>([]);
  const [keywords, setKeywords] = React.useState<Array<{ query: string; clicks: number; impressions: number; ctr: number; position: number }>>(
    []
  );

  React.useEffect(() => {
    if (status !== "authenticated") return;
    (async () => {
      // GA4 properties
      try {
        const r = await fetch("/api/google/ga4/properties");
        const json = await r.json();
        const opts: Option[] = (json.items ?? []).map((p: any) => ({ label: p.name, value: p.id }));
        setGa4Options(opts);
      } catch {}

      // GSC sites
      try {
        const r = await fetch("/api/google/gsc/sites");
        const json = await r.json();
        const opts: Option[] = (json.items ?? []).map((s: any) => ({ label: s.siteUrl, value: s.siteUrl }));
        setGscOptions(opts);
      } catch {}
    })();
  }, [status]);

  React.useEffect(() => {
    if (!ga4PropertyId || status !== "authenticated") return;
    (async () => {
      try {
        const r = await fetch(`/api/ga/traffic?propertyId=${encodeURIComponent(ga4PropertyId)}&start=${start}&end=${end}`);
        const json = await r.json();
        setTraffic(json.points ?? []);
      } catch {
        setTraffic([]);
      }
    })();
  }, [ga4PropertyId, start, end, status]);

  React.useEffect(() => {
    if (!gscSiteUrl || status !== "authenticated") return;
    (async () => {
      try {
        const r = await fetch(`/api/google/gsc/keywords?siteUrl=${encodeURIComponent(gscSiteUrl)}&start=${start}&end=${end}`);
        const json = await r.json();
        setKeywords(json.rows ?? []);
      } catch {
        setKeywords([]);
      }
    })();
  }, [gscSiteUrl, start, end, status]);

  const insights: InsightCard[] = React.useMemo(() => {
    const movers = [...keywords]
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 3)
      .map((r) => `“${r.query}” (${Math.round(r.position)} avg pos, ${r.clicks} clicks)`)
      .join("; ");
    const items: InsightCard[] = [];
    if (traffic.length) {
      const total = traffic.reduce((s, p) => s + p.value, 0);
      items.push({ title: "Traffic trend", body: `Sessions over period: ${total.toLocaleString()}`, severity: "info" });
    }
    if (movers) {
      items.push({ title: "Top movers (GSC)", body: movers, severity: "action" });
    }
    return items;
  }, [traffic, keywords]);

  return (
    <div style={{ maxWidth: 1100, margin: "40px auto", padding: "0 16px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>VSight Pro — Local SEO Cockpit</h1>
        {status === "authenticated" ? (
          <button onClick={() => signOut()} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd" }}>
            Sign out
          </button>
        ) : (
          <button onClick={() => signIn("google")} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd" }}>
            Sign in with Google
          </button>
        )}
      </header>

      {status !== "authenticated" ? (
        <div>Please sign in to connect GA4 & GSC.</div>
      ) : (
        <>
          <section style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr" }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <DateRange start={start} end={end} onStart={setStart} onEnd={setEnd} />
              <Dropdown label="GA4 Property" options={ga4Options} value={ga4PropertyId} onChange={setGa4PropertyId} />
              <Dropdown label="GSC Site" options={gscOptions} value={gscSiteUrl} onChange={setGscSiteUrl} />
            </div>

            <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 16 }}>
              <h3 style={{ margin: "0 0 8px 0" }}>Traffic (sessions)</h3>
              <Sparkline points={traffic} />
              {!ga4PropertyId && <div style={{ fontSize: 12, color: "#666" }}>Select a GA4 property</div>}
            </div>

            <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 16 }}>
              <h3 style={{ margin: "0 0 8px 0" }}>Insights</h3>
              <InsightsCards items={insights} />
            </div>

            <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 16 }}>
              <h3 style={{ margin: "0 0 8px 12px" }}>Top keywords</h3>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Query", "Clicks", "Impressions", "CTR", "Position"].map((h) => (
                        <th key={h} style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eee" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {keywords.slice(0, 50).map((r, i) => (
                      <tr key={i}>
                        <td style={{ padding: 8, borderBottom: "1px solid #f5f5f5" }}>{r.query}</td>
                        <td style={{ padding: 8, borderBottom: "1px solid #f5f5f5" }}>{r.clicks}</td>
                        <td style={{ padding: 8, borderBottom: "1px solid #f5f5f5" }}>{r.impressions}</td>
                        <td style={{ padding: 8, borderBottom: "1px solid #f5f5f5" }}>
                          {(r.ctr * 100).toFixed(2)}%
                        </td>
                        <td style={{ padding: 8, borderBottom: "1px solid #f5f5f5" }}>
                          {r.position.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                    {!gscSiteUrl && (
                      <tr><td colSpan={5} style={{ padding: 8, color: "#666" }}>Select a GSC site</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
