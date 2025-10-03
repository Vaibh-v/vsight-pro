import { DateRange, MetricPoint } from "@/lib/contracts";
import { synthSeries, sum } from "./_util";

export type ProviderConfig = { token?: string; apiKey?: string; projectId?: string; [k: string]: any };

export async function isConfigured(): Promise<boolean> {
  // Real check later; always allow mock for now
  return true;
}

export async function listResources(_cfg: ProviderConfig): Promise<{ label: string; value: string }[]> {
  // Replace with live fetch if token present; mock list for stability
  return [
    { label: "GA4 Property A", value: "ga4:propA" },
    { label: "GA4 Property B", value: "ga4:propB" },
    { label: "GA4 Property C", value: "ga4:propC" }
  ];
}

export async function fetchTimeseries(
  _cfg: ProviderConfig & { resourceId: string; range: DateRange }
): Promise<Record<string, MetricPoint[]>> {
  const sessions = synthSeries(_cfg.range, 120, 0.15);
  return { sessions };
}

export async function fetchKpis(
  _cfg: ProviderConfig & { resourceId: string; range: DateRange }
): Promise<Record<string, number>> {
  const sessions = synthSeries(_cfg.range, 120, 0.15);
  return { sessionsTotal: sum(sessions) };
}
