import * as React from "react";
import useSWR from "swr";
import { DateRange } from "@/components/DateRange";
import { Dropdown } from "@/components/Dropdown";
import { Sparkline } from "@/components/Chart";
import { InsightsCards, type InsightCard } from "@/components/InsightsCards";

const fetcher = (url: string, opts?: any) => fetch(url, opts).then(r => r.json());

export default function Home() {
  const today = new Date();
  const endDefault = today.toISOString().slice(0,10);
  const startDefault = new Date(today.getTime() - 27*86400000).toISOString().slice(0,10);

  const [start, setStart] = React.useState(startDefault);
  const [end, setEnd] = React.useState(endDefault);

  const { data: gaProps } = useSWR("/api/google/ga4/properties", fetcher);
  const { data: gscSites } = useSWR("/api/google/gsc/sites", fetcher);

  const [gaProp, setGaProp] = React.useState<string>("");
  const [gscSite, setGscSite] = React.useState<string>("");

  const { data: traffic } = useSWR(
    gaProp ? `/api/ga/traffic?propertyId=${encodeURIComponent(gaProp)}&start=${start}&end=${end}` : null,
    fetcher
  );

  const { data: insights, isValidating: insightsLoading, mutate: recompute } = useSWR<{
    items: InsightCard[];
  }>(
    gscSite ? ["/api/insights/compute", gscSite, start, end].join("|") : null,
    (key: string) => {
      const [, site] = key.split("|");
      return fetcher("/api/insights/compute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gscSiteUrl: site, start, end }),
      });
    }
  );

  const trafficPoints = (traffic?.points ?? []).map((p: any) => ({ date: p.date, value: p.sessions }));

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <h1 className="text-2xl font-semibold">VSight — Local SEO Cockpit</h1>
            <p className="text-neutral-400 mt-1">Connect GA4 + Search Console. Track traffic, coverage, movers.</p>
          </div>
          <DateRange start={start} end={end} onStart={setStart} onEnd={setEnd} />
        </header>

        <section className="mt-8 grid md:grid-cols-2 gap-6">
          <Dropdown
            label="GA4 Property"
            options={(gaProps?.items ?? []).map((p: any) => ({ value: p.id, label: p.name }))}
            value={gaProp}
            onChange={setGaProp}
          />
          <Dropdown
            label="GSC Site"
            options={(gscSites?.items ?? []).map((s: any) => ({ value: s.siteUrl, label: s.siteUrl }))}
            value={gscSite}
            onChange={setGscSite}
          />
        </section>

        <section className="mt-8 grid md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-neutral-800 p-4 col-span-1 md:col-span-2">
            <div className="text-sm text-neutral-400 mb-2">Traffic (sessions)</div>
            {trafficPoints?.length ? <Sparkline points={trafficPoints} /> : <div className="text-neutral-500">Select a GA4 property</div>}
            {traffic?.totalSessions != null && (
              <div className="mt-3 text-sm">Total: <b>{traffic.totalSessions}</b></div>
            )}
          </div>
          <div className="rounded-2xl border border-neutral-800 p-4">
            <div className="text-sm text-neutral-400 mb-2">Insights</div>
            <button
              className="rounded-xl border border-neutral-700 px-3 py-2 text-sm hover:bg-neutral-900"
              onClick={() => recompute()}
              disabled={!gscSite || insightsLoading}
            >
              {insightsLoading ? "Computing…" : "Compute insights"}
            </button>
            <div className="text-xs text-neutral-500 mt-2">Requires a selected GSC site</div>
          </div>
        </section>

        <section className="mt-6">
          <InsightsCards items={insights?.items ?? []} />
        </section>
      </div>
    </main>
  );
}
