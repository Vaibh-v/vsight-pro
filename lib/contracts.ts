// -----------------------------------------------------------------------------
// VSight Pro – shared contracts & types
// Centralized, import-only types used across /lib and /pages.
// -----------------------------------------------------------------------------

// --- Common ---
export type ISODate = string; // YYYY-MM-DD
export type DateRange = { start: ISODate; end: ISODate };

// --- GA4 (traffic) ---
export type TrafficPoint = { date: ISODate; sessions: number };

export type TrafficSeries = {
  points: TrafficPoint[];
  total: number; // total sessions across the range
};

// Optional shape for listing GA4 properties (used by /api/google/ga4/properties)
export type Ga4Property = {
  id: string;          // e.g., "properties/123456789"
  name: string;        // display name
  accountName?: string;
};

// --- GSC (keywords/pages) ---
export type GscKeywordRow = {
  date: ISODate;
  query: string;
  page?: string;
  country?: string; // ISO country code if requested
  clicks: number;
  impressions: number;
  ctr: number;       // 0..1
  position: number;  // avg position
};

export type GscKeywordsResponse = {
  rows: GscKeywordRow[];
};

// --- GBP (insights v1.1) ---
export type GbpInsight = {
  date: ISODate;
  calls: number;
  directions: number;
  websiteClicks: number;
  viewsSearch: number;
  viewsMaps: number;
};

export type GbpInsightsResponse = {
  rows: GbpInsight[];
};

export type GbpLocation = {
  locationId: string; // e.g., "locations/123456789"
  name: string;
  lat?: number;
  lng?: number;
  primaryCategory?: string;
  address?: string;
};

// --- Insights (server-computed) ---
export type InsightSeverity = 'info' | 'warn' | 'action';
export type InsightType = 'TOP_COVERAGE' | 'MOVER' | 'GEO_GAP' | 'CRO_OPPORTUNITY';

export type InsightCardBase = {
  id: string;
  type: InsightType;
  severity: InsightSeverity;
  period: DateRange;
};

export type CoveragePayload = {
  top3: number;
  top10: number;
  top50: number;
  deltaTop3: number;
  deltaTop10: number;
  deltaTop50: number;
};

export type MoversPayload = {
  topGainers: { query: string; delta: number }[];
  topLosers: { query: string; delta: number }[];
};

export type CoverageInsightCard = InsightCardBase & {
  type: 'TOP_COVERAGE';
  payload: CoveragePayload;
};

export type MoversInsightCard = InsightCardBase & {
  type: 'MOVER';
  payload: MoversPayload;
};

export type GeoGapInsightCard = InsightCardBase & {
  type: 'GEO_GAP';
  payload: {
    // queries present in GBP actions but weak in GSC (pos > 10), etc.
    opportunities: { query: string; page?: string; position?: number }[];
  };
};

export type CroOpportunityInsightCard = InsightCardBase & {
  type: 'CRO_OPPORTUNITY';
  payload: {
    // pages with high GA sessions + Clarity rage/low scroll
    pages: { path: string; reason: string }[];
  };
};

export type InsightCard =
  | CoverageInsightCard
  | MoversInsightCard
  | GeoGapInsightCard
  | CroOpportunityInsightCard;

// --- “Driver” interfaces (optional, used by older integration files) ---
// If you prefer dependency-injected drivers, these keep imports happy.
// Our current implementation uses fetch-based helpers under /lib/google.ts.

export interface AnalyticsDriver {
  getTrafficSeries(propertyId: string, range: DateRange): Promise<TrafficSeries>;
}

export interface GscDriver {
  getKeywords(params: {
    siteUrl: string;
    range: DateRange;
    country?: string;   // 'ALL' or ISO code
    pagePath?: string;  // optional page filter
  }): Promise<GscKeywordsResponse>;
}

export interface GbpDriver {
  getInsights(locationId: string, range: DateRange): Promise<GbpInsight[]>;
}

// --- API DTOs (for serverless routes) ---
export type ApiTrafficResponse = {
  points: { date: ISODate; sessions: number }[];
  totalSessions: number;
};

export type ApiGscKeywordsResponse = {
  rows: GscKeywordRow[];
};

export type ApiGbpInsightsResponse = {
  rows: GbpInsight[];
};

export type ApiInsightsComputeRequest = {
  ga4PropertyId?: string;
  gscSiteUrl?: string;
  gbpLocationId?: string;
  start: ISODate;
  end: ISODate;
  country?: string; // 'ALL' or ISO
};

export type ApiInsightsComputeResponse = {
  items: InsightCard[];
};
