import * as React from "react";
import Dropdown from "@/components/Dropdown";
import { DateRange } from "@/components/DateRange";
import Sparkline from "@/components/Sparkline";
import InsightCards from "@/components/InsightCards";
import { DashboardPayload, AiPanel } from "@/lib/contracts";
import { Kpi } from "@/components/Kpi";

function today(): string {
  return new Date().toISOString().slice(0,10);
}
function daysAgo(n: number): string {
  const d = new Date(); d.setDate(d.getDate()-n); return d.toISOString().slice(0,10);
}

export default function Home() {
  const [start, setStart] = React.useState(daysAgo(28));
  const [end, setEnd] = React.useState(today());
  const [ga4, setGa4] = React.useState("");
  const [gsc, setGsc] = React.useState("");
  const [gbp, setGbp] = React.useState("");

  const qs = new URLSearchParams({ rangeStart: start, rangeEnd: end });
  if (ga4) qs.set("ga4", ga4);
  if (gsc) qs.set("gsc", gsc);
  if (gbp) qs.set("gbp", gbp);

  const [data, setData] = React.useState<DashboardPayload | null>(null);
  const [panel, setPanel] = React.useState<AiPanel | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      const r = await fetch(`/api/dashboard?${qs.toString()}`);
      const j = await r.json();
      if (!alive) return;
      setData(j);
    })();
    (async () => {
      const r = await fetch(`/api/insights?${qs.toString()}`);
      const j = await r.json();
      if (!alive) return;
      setPanel(j);
    })();
    return () => { alive = false; };
  }, [start, end, ga4, gsc, gbp]);

  return (
    <main className="max-w-6xl mx-auto p-4 grid gap-6">
      <h1 className="text-2xl font-semibold">VSight Pro — Unified SEO/Local Dashboard</h1>

      <div className="flex flex-wrap items-center gap-4">
        <DateRange start={start} end={end} onStart={setStart} onEnd={setEnd} />
        <Dropdown label="GA4 Property" value={ga4} onChange={setGa4} source="/api/providers/ga4/resources" />
        <Dropdown label="GSC Site" value={gsc} onChange={setGsc} source="/api/providers/gsc/resources" />
        <Dropdown label="GBP Location" value={gbp} onChange={setGbp} source="/api/providers/gbp/resources" />
      </div>

      <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Kpi label="Sessions" value={data?.kpis.sessionsTotal} />
        <Kpi label="Impressions" value={data?.kpis.impressionsTotal} />
        <Kpi label="Clicks" value={data?.kpis.clicksTotal} />
        <Kpi label="GBP Views" value={data?.kpis.viewsTotal} />
        <Kpi label="GBP Actions" value={data?.kpis.actionsTotal} />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border rounded-xl">
          <h3 className="font-medium mb-2">Sessions</h3>
          <Sparkline points={data?.timeseries.sessions || []} />
        </div>
        <div className="p-4 border rounded-xl">
          <h3 className="font-medium mb-2">Search (Impressions / Clicks)</h3>
          <Sparkline points={data?.timeseries.impressions || []} />
          <div className="h-2" />
          <Sparkline points={data?.timeseries.clicks || []} />
        </div>
        <div className="p-4 border rounded-xl">
          <h3 className="font-medium mb-2">GBP Views</h3>
          <Sparkline points={data?.timeseries.views || []} />
        </div>
        <div className="p-4 border rounded-xl">
          <h3 className="font-medium mb-2">GBP Actions</h3>
          <Sparkline points={data?.timeseries.actions || []} />
        </div>
      </section>

      <section className="p-4 border rounded-xl">
        <h3 className="font-medium mb-2">AI Insights</h3>
        <InsightCards panel={panel || { items: [] }} />
      </section>
    </main>
  );
}
