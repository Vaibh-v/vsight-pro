import type { DateRange } from "@/lib/google";

/**
 * Pure functions to build report payloads from inputs.
 * Replace the mocked bits with real GA/GSC/GBP fetches as you finalize specs.
 */

export type ReportSection =
  | { kind: "metric"; title: string; value: number | string; hint?: string }
  | { kind: "chart"; title: string; points: { date: string; value: number }[] };

export type ReportPayload = {
  title: string;
  range: DateRange;
  sections: ReportSection[];
};

export async function buildWeeklyReport(opts: {
  propertyId?: string;
  siteUrl?: string;
  range: DateRange;
  token?: string; // Google bearer if available
}): Promise<ReportPayload> {
  const { range } = opts;

  // Stubbed data so UI compiles and renders deterministically.
  const points = Array.from({ length: 7 }).map((_, i) => ({
    date: new Date(Date.now() - (6 - i) * 86400000).toISOString().slice(0, 10),
    value: 100 + i * 7,
  }));

  return {
    title: "Weekly Performance",
    range,
    sections: [
      { kind: "metric", title: "Sessions (GA4)", value: 1234 },
      { kind: "metric", title: "Top Query Clicks (GSC)", value: 321 },
      { kind: "chart", title: "Sessions (7-day)", points }
    ],
  };
}
