import { DateRange, MetricPoint } from "@/lib/contracts";
import { synthSeries, sum } from "./_util";

export type ProviderConfig = { token?: string; [k: string]: any };

export async function isConfigured(): Promise<boolean> {
  return true; // mock-safe
}

export async function listResources(_cfg: ProviderConfig): Promise<{ label: string; value: string }[]> {
  return [
    { label: "example.com", value: "https://example.com/" },
    { label: "shop.example.com", value: "https://shop.example.com/" }
  ];
}

export async function fetchTimeseries(
  _cfg: ProviderConfig & { resourceId: string; range: DateRange }
): Promise<Record<string, MetricPoint[]>> {
  const impressions = synthSeries(_cfg.range, 900, 0.25);
  const clicks = synthSeries(_cfg.range, 45, 0.3);
  return { impressions, clicks };
}

export async function fetchKpis(
  _cfg: ProviderConfig & { resourceId: string; range: DateRange }
): Promise<Record<string, number>> {
  const impressions = synthSeries(_cfg.range, 900, 0.25);
  const clicks = synthSeries(_cfg.range, 45, 0.3);
  return { impressionsTotal: sum(impressions), clicksTotal: sum(clicks) };
}
