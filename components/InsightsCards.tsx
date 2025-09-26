import * as React from "react";

export type InsightCard = { title: string; body?: string; severity?: "info" | "warn" | "error" };

type Props =
  | { items: InsightCard[] }
  | { start?: string; end?: string; ga4PropertyId?: string; gscSiteUrl?: string };

export function InsightsCards(props: Props) {
  if ("items" in props) {
    const items = props.items ?? [];
    if (!items.length) return <div className="text-xs text-gray-500">No insights yet.</div>;
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map((i, idx) => (
          <div key={idx} className="border rounded p-3">
            <div className="font-medium">{i.title}</div>
            {i.body && <div className="text-sm mt-1">{i.body}</div>}
          </div>
        ))}
      </div>
    );
  }
  // Accept filter-like props without breaking the build:
  return (
    <div className="text-xs text-gray-500">
      Insights will appear here once data is available for the selected range & sources.
    </div>
  );
}

export default InsightsCards;
