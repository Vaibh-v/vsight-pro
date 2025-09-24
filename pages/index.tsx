import * as React from "react";
import Header from "@/components/Header";
import { DateRange } from "@/components/DateRange";
import { Dropdown } from "@/components/Dropdown";
import { Sparkline } from "@/components/Chart";
// ✅ Use named import (matches your component file)
import { InsightsCards } from "@/components/InsightsCards";
import { useSession } from "next-auth/react";

// Minimal fetch hook to keep deps light
function useFetch<T = any>(key: string | null) {
  const [data, setData] = React.useState<T | undefined>();
  const [error, setError] = React.useState<any>();
  const [loading, setLoading] = React.useState<boolean>(!!key);

  React.useEffect(() => {
    let alive = true;
    if (!key) {
      setLoading(false);
      setData(undefined);
      setError(undefined);
      return;
    }
    setLoading(true);
    fetch(key)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((j) => alive && setData(j))
      .catch((e) => alive && setError(e))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [key]);

  return { data, error, isLoading: loading };
}

export default function Home() {
  const { status } = useSession(); // APIs enforce auth; this is UX only
  const [ga4PropertyId, setGa4PropertyId] = React.useState<string | undefined>();
  const [gscSiteUrl, setGscSiteUrl] = React.useState<string | undefined>();
  const [range, setRange] = React.useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10),
    end: new Date().toISOString().slice(0, 10),
  });

  const trafficKey =
    ga4PropertyId
      ? `/api/ga/traffic?propertyId=${encodeURIComponent(ga4PropertyId)}&start=${range.start}&end=${range.end}`
      : null;

  const keywordsKey =
    gscSiteUrl
      ? `/api/gsc/keywords?siteUrl=${encodeURIComponent(gscSiteUrl)}&start=${range.start}&end=${range.end}&country=ALL`
      : null;

  const { data: traffic, isLoading: trafficLoading } =
    useFetch<{ points: { date: string; sessions: number }[]; totalSessions: number }>(trafficKey);
  const { data: keywords, isLoading: keywordsLoading } =
    useFetch<{ rows: any[] }>(keywordsKey);

  return (
    <main className="p-6 space-y-6">
      <Header />

      <p className="text-sm text-gray-600">
        Connect GA4 + Search Console. Track traffic, coverage, movers.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <span>Start</span>
        <DateRange value={range} onChange={setRange} />
        <Dropdown
          label="GA4 Property"
          value={ga4PropertyId}
          onChange={setGa4PropertyId}
          source="/api/google/ga4/properties"
        />
        <Dropdown
          label="GSC Site"
          value={gscSiteUrl}
          onChange={setGscSiteUrl}
          source="/api/google/gsc/sites"
        />
      </div>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-1 md:col-span-2 p-4 border rounded-xl">
          <h3 className="font-medium mb-2">Traffic (sessions)</h3>
          <Sparkline loading={trafficLoading} points={traffic?.points ?? []} />
          {!ga4PropertyId && <div className="text-xs mt-2 text-gray-500">Select a GA4 property</div>}
        </div>

        <div className="p-4 border rounded-xl">
          <h3 className="font-medium mb-2">Insights</h3>
          <InsightsCards
            start={range.start}
            end={range.end}
            ga4PropertyId={ga4PropertyId}
            gscSiteUrl={gscSiteUrl}
          />
          {!gscSiteUrl && <div className="text-xs mt-2 text-gray-500">Requires a selected GSC site</div>}
        </div>
      </section>

      <section className="p-4 border rounded-xl">
        <h3 className="font-medium mb-2">Keywords</h3>
        {keywordsLoading ? (
          <div>Loading…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-4">Query</th>
                  <th className="py-2 pr-4">Clicks</th>
                  <th className="py-2 pr-4">Impr.</th>
                  <th className="py-2 pr-4">CTR</th>
                  <th className="py-2 pr-4">Pos.</th>
                </tr>
              </thead>
              <tbody>
                {(keywords?.rows ?? []).slice(0, 50).map((r, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2 pr-4">{r.query}</td>
                    <td className="py-2 pr-4">{r.clicks}</td>
                    <td className="py-2 pr-4">{r.impressions}</td>
                    <td className="py-2 pr-4">{(r.ctr * 100).toFixed(1)}%</td>
                    <td className="py-2 pr-4">{Number(r.position).toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {status !== "authenticated" && (
        <div className="text-xs text-gray-500">
          Tip: sign in first to populate GA4/GSC dropdowns.
        </div>
      )}
    </main>
  );
}
