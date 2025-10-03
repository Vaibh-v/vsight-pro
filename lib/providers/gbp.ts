import { DateRange, MetricPoint } from "@/lib/contracts";
import { synthSeries, sum } from "./_util";

export type ProviderConfig = { token?: string; [k: string]: any };

export async function isConfigured(): Promise<boolean> {
  return true; // mock-safe
}

export async function listResources(_cfg: ProviderConfig): Promise<{ label: string; value: string }[]> {
  return [
    { label: "Main Street Store", value: "gbp:loc:main-street" },
    { label: "Airport Kiosk", value: "gbp:loc:airport" }
  ];
}

export async function fetchTimeseries(
  _cfg: ProviderConfig & { resourceId: string; range: DateRange }
): Promise<Record<string, MetricPoint[]>> {
  const views = synthSeries(_cfg.range, 300, 0.2);
  const actions = synthSeries(_cfg.range, 20, 0.35);
  return { views, actions };
}

export async function fetchKpis(
  _cfg: ProviderConfig & { resourceId: string; range: DateRange }
): Promise<Record<string, number>> {
  const views = synthSeries(_cfg.range, 300, 0.2);
  const actions = synthSeries(_cfg.range, 20, 0.35);
  return { viewsTotal: sum(views), actionsTotal: sum(actions) };
}
