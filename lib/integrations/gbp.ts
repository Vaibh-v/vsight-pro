import { google } from "googleapis";
import type { DateRange, GbpDriver, GbpInsight } from "@/lib/contracts";
import { OAuth2Client } from "google-auth-library";

export function gbpDriver(accessToken: string): GbpDriver {
  const auth = new OAuth2Client();
  auth.setCredentials({ access_token: accessToken });
  const mybusiness = google.mybusinessbusinessinformation({ version: "v1", auth } as any);
  const perf = google.mybusinessbusinessinformation({ version: "v1", auth } as any); // NOTE: placeholder; wire correct perf client

  return {
    async insights(range: DateRange, locationId?: string): Promise<GbpInsight[]> {
      // TODO: Business Profile Performance API (daily insights)
      return [
        {
          date: range.start,
          viewsSearch: 220,
          viewsMaps: 180,
          calls: 5,
          directions: 9,
          websiteClicks: 14,
          topQueries: ["plumber", "emergency plumber", "leak repair"]
        },
        {
          date: range.end,
          viewsSearch: 260,
          viewsMaps: 210,
          calls: 7,
          directions: 12,
          websiteClicks: 17,
          topQueries: ["plumber", "water heater", "pipe burst"]
        }
      ];
    },
    async topQueries(range: DateRange, _locationId?: string): Promise<string[]> {
      return ["plumber", "water heater repair", "drain cleaning"];
    }
  };
}
