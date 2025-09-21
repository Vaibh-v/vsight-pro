export type DateRange = { start: string; end: string };
export type Country = string | "ALL";

export type TrafficPoint = { date: string; sessions: number; users?: number; pageViews?: number };
export type KeywordPoint = { date: string; query: string; clicks: number; impressions: number; ctr: number; position: number; country?: Country };
export type PagePoint = { date: string; page: string; clicks: number; impressions: number; ctr: number; position: number };

export type GbpInsight = {
  date: string;
  viewsSearch: number;
  viewsMaps: number;
  calls: number;
  directions: number;
  websiteClicks: number;
  topQueries: string[];
};

export type RankBuckets = { top3: number; top10: number; top50: number };

export interface AnalyticsDriver {
  traffic(range: DateRange): Promise<TrafficPoint[]>;
  trafficByPage(range: DateRange, path?: string): Promise<TrafficPoint[]>;
}

export interface SearchConsoleDriver {
  keywords(range: DateRange, country?: Country): Promise<KeywordPoint[]>;
  pages(range: DateRange, country?: Country): Promise<PagePoint[]>;
  rankBuckets(range: DateRange, country?: Country): Promise<RankBuckets>;
}

export interface GbpDriver {
  insights(range: DateRange, locationId?: string): Promise<GbpInsight[]>;
  topQueries(range: DateRange, locationId?: string): Promise<string[]>;
}
