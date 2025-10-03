import { DashboardPayload, TimeseriesBundle, Kpis, MetricPoint } from "@/lib/contracts";

export function sumSeries(series?: MetricPoint[]): number {
  if (!series) return 0;
  return series.reduce((acc, p) => acc + (p.value || 0), 0);
}

export function mergeBundles(...bundles: TimeseriesBundle[]): TimeseriesBundle {
  const out: TimeseriesBundle = {};
  const keys: (keyof TimeseriesBundle)[] = ["sessions", "impressions", "clicks", "views", "actions"];
  for (const key of keys) {
    const merged: Record<string, number> = {};
    for (const b of bundles) {
      const list = b[key] || [];
      for (const p of list) {
        merged[p.date] = (merged[p.date] || 0) + p.value;
      }
    }
    const points = Object.entries(merged)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, value]) => ({ date, value }));
    if (points.length) out[key] = points;
  }
  return out;
}

export function totals(bundle: TimeseriesBundle): Kpis {
  return {
    sessionsTotal: sumSeries(bundle.sessions),
    impressionsTotal: sumSeries(bundle.impressions),
    clicksTotal: sumSeries(bundle.clicks),
    viewsTotal: sumSeries(bundle.views),
    actionsTotal: sumSeries(bundle.actions)
  };
}

export function assembleDashboard(...bundles: TimeseriesBundle[]): DashboardPayload {
  const merged = mergeBundles(...bundles);
  return {
    timeseries: merged,
    kpis: totals(merged),
    sourceBreakdown: undefined
  };
}
