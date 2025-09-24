export type InsightCard = {
  id: string;
  type: "TOP_COVERAGE" | "MOVER";
  severity: "info" | "warn" | "action";
  period: { start: string; end: string };
  payload: any;
};

export function InsightsCards({ items }: { items: InsightCard[] }) {
  if (!items?.length) return null;
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {items.map((c) => (
        <div key={c.id} className="rounded-2xl border border-neutral-800 p-4">
          <div className="text-xs uppercase tracking-wider text-neutral-400">{c.type}</div>
          {c.type === "TOP_COVERAGE" && (
            <div className="mt-2 text-sm">
              <div>Top 3: <b>{c.payload.top3}</b> ({c.payload.deltaTop3 >= 0 ? "▲" : "▼"} {c.payload.deltaTop3})</div>
              <div>Top 10: <b>{c.payload.top10}</b> ({c.payload.deltaTop10 >= 0 ? "▲" : "▼"} {c.payload.deltaTop10})</div>
              <div>Top 50: <b>{c.payload.top50}</b> ({c.payload.deltaTop50 >= 0 ? "▲" : "▼"} {c.payload.deltaTop50})</div>
            </div>
          )}
          {c.type === "MOVER" && (
            <div className="mt-2 text-sm grid grid-cols-2 gap-3">
              <div>
                <div className="text-neutral-400 mb-1">Top Gainers</div>
                <ul className="space-y-1">
                  {c.payload.topGainers?.slice(0,5).map((r: any) => (
                    <li key={r.query}><b>+{r.delta}</b> — {r.query}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-neutral-400 mb-1">Top Losers</div>
                <ul className="space-y-1">
                  {c.payload.topLosers?.slice(0,5).map((r: any) => (
                    <li key={r.query}><b>{r.delta}</b> — {r.query}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
