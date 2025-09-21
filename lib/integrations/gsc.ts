import { google } from "googleapis";
import type { Country, DateRange, KeywordPoint, PagePoint, RankBuckets, SearchConsoleDriver } from "@/lib/contracts";
import { OAuth2Client } from "google-auth-library";

export function gscDriver(accessToken: string): SearchConsoleDriver {
  const auth = new OAuth2Client();
  auth.setCredentials({ access_token: accessToken });
  const sc = google.searchconsole({ version: "v1", auth } as any);

  return {
    async keywords(range: DateRange, country?: Country): Promise<KeywordPoint[]> {
      // TODO: sc.searchanalytics.query with dimensions query,date (and country filter)
      return [
        { date: range.start, query: "plumbers near me", clicks: 12, impressions: 200, ctr: 0.06, position: 7.2, country },
        { date: range.end, query: "water heater repair", clicks: 18, impressions: 260, ctr: 0.069, position: 6.1, country }
      ];
    },
    async pages(range: DateRange, country?: Country): Promise<PagePoint[]> {
      // TODO: sc.searchanalytics.query with dimension page
      return [
        { date: range.start, page: "/services", clicks: 15, impressions: 300, ctr: 0.05, position: 9.1 },
        { date: range.end, page: "/contact", clicks: 9, impressions: 120, ctr: 0.075, position: 8.2 }
      ];
    },
    async rankBuckets(range: DateRange, country?: Country): Promise<RankBuckets> {
      // TODO: compute from keyword positions
      return { top3: 12, top10: 43, top50: 138 };
    }
  };
}
