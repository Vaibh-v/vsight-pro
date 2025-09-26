import * as React from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { DateRange } from "@/components/DateRange";
import { Dropdown, type Option } from "@/components/Dropdown";
import { Sparkline } from "@/components/Chart";
import InsightsCards, { type InsightCard } from "@/components/InsightsCards";

type GaPropsResp = { items: { id: string; name: string }[] };
type GscSitesResp = { items: { siteUrl: string; permissionLevel: string }[] };
type GaTrafficResp = { points: { date: string; sessions: number }[]; totalSessions: number };

function iso(daysAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

export default function Home() {
  const { data: session, status } = useSession();
  const authed = status === "authenticated";

  const [start, setStart] = React.useState(iso(28));
  const [end, setEnd] = React.useState(iso(1));

  const [gaOptions, setGaOptions] = React.useState<Option[]>([]);
  const [gscOptions, setGscOptions] = React.useState<Option[]>([]);
  const [ga4PropertyId, setGa4PropertyId] = React.useState("");
  const [gscSiteUrl, setGscSiteUrl] = React.useState("");

  const [sparkPoints, setSparkPoints] = React.useState<{ date: string; value: number }[]>([]);
  const [insights, setInsights] = React.useState<InsightCard[]>([]);

  // Load entities after auth
  React.useEffect(() => {
    if (!authed) return;
    (async () => {
      const propsRes = await fetch("/api/google/ga4/properties").then(r => r.json() as Promise<GaPropsResp>);
      setGaOptions((propsRes.items || []).map(p => ({ label: p.name, value: p.id })));
      const sitesRes = await fetch("/api/google/gsc/sites").then(r => r.json() as Promise<GscSitesResp>);
      setGscOptions((sitesRes.items || []).map(s => ({ label: s.siteUrl, value: s.siteUrl })));
    })();
  }, [authed]);

  // Load GA4 traffic when property selected
  React.useEffect(() => {
    if (!authed || !ga4PropertyId || !start || !end) return;
    (async () => {
      const qs = new URLSearchParams({ propertyId: ga4PropertyId, start, end });
      const data = await fetch(`/api/ga/traffic?${qs}`).then(r => r.json() as Promise<GaTrafficResp>);
      const points = (data.points || []).map(p => ({ date: p.date, value: p.sessions }));
      setSparkPoints(points);
    })();
  }, [authed, ga4PropertyId, start, end]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">VSight Pro — Local SEO Cockpit</h1>
        {authed ? (
          <button className="border rounded px-3 py-1" onClick={() => signOut()}>Sign out</button>
        ) : (
          <button className="border rounded px-3 py-1" onClick={() => signIn("google")}>Sign in with Google</button>
        )}
      </header>

      {!authed && (
        <div className="text-sm text-gray-600">
          Please sign in with Google to connect GA4 & GSC.
        </div>
      )}

      {authed && (
        <>
          <div className="flex flex-wrap items-center gap-4">
            <DateRange start={start} end={end} onStart={setStart} onEnd={setEnd} />
            <Dropdown label="GA4 Property" options={gaOptions} value={ga4PropertyId} onChange={setGa4PropertyId} />
            <Dropdown label="GSC Site" options={gscOptions} value={gscSiteUrl} onChange={setGscSiteUrl} />
          </div>

          <div className="grid gap-4">
            <div className="p-4 border rounded-xl">
              <h3 className="font-medium mb-2">Traffic (sessions)</h3>
              <Sparkline points={sparkPoints} />
              {!ga4PropertyId && <div className="text-xs mt-2 text-gray-500">Select a GA4 property</div>}
            </div>

            <div className="p-4 border rounded-xl">
              <h3 className="font-medium mb-2">Insights</h3>
              <InsightsCards items={insights} />
              <div className="text-xs text-gray-500 mt-2">Insights engine to be enabled after GSC keywords/coverage.</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
