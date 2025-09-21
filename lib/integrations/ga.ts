import { google } from "googleapis";
import type { AnalyticsDriver, DateRange, TrafficPoint } from "@/lib/contracts";
import { OAuth2Client } from "google-auth-library";

export function gaDriver(accessToken: string): AnalyticsDriver {
  const auth = new OAuth2Client();
  auth.setCredentials({ access_token: accessToken });
  const data = google.analyticsdata({ version: "v1beta", auth });

  return {
    async traffic(range: DateRange): Promise<TrafficPoint[]> {
      // TODO: call data.properties.runReport with metrics: sessions/users, dims: date
      // return live values. For now, stub:
      return [
        { date: range.start, sessions: 120 },
        { date: range.end, sessions: 145 }
      ];
    },
    async trafficByPage(range: DateRange): Promise<TrafficPoint[]> {
      // TODO: GA4 by page
      return [
        { date: range.start, sessions: 40, pageViews: 80 },
        { date: range.end, sessions: 60, pageViews: 110 }
      ];
    }
  };
}
