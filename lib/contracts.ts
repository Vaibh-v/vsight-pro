export type DateRange = { start: string; end: string };

export type MetricPoint = { date: string; value: number };
export type TimeseriesBundle = {
  sessions?: MetricPoint[];
  impressions?: MetricPoint[];
  clicks?: MetricPoint[];
  views?: MetricPoint[];
  actions?: MetricPoint[];
};

export type Kpis = {
  sessionsTotal?: number;
  impressionsTotal?: number;
  clicksTotal?: number;
  viewsTotal?: number;
  actionsTotal?: number;
};

export type InsightCard = {
  title: string;
  body: string;
  severity: "info" | "good" | "warn";
};

export type LocationOption = { label: string; value: string }; // GBP
export type PropertyOption = { label: string; value: string }; // GA4
export type SiteOption = { label: string; value: string };     // GSC

export type DashboardPayload = {
  timeseries: TimeseriesBundle;
  kpis: Kpis;
  sourceBreakdown?: Record<string, number>;
};

export type AiPanel = { items: InsightCard[] };
