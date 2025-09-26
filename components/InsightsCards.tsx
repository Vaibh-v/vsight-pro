import * as React from "react";

export type InsightSeverity = "info" | "warn" | "action";
export type InsightType = "TOP_COVERAGE" | "MOVER" | "GEO_GAP" | "CRO_OPPORTUNITY" | string;

export type InsightCard = {
  id?: string;
  type: InsightType;
  severity: InsightSeverity;
  payload: any;
  dateStart?: string;
  dateEnd?: string;
  createdAt?: string;
};

type Props = {
  /** ISO yyyy-mm-dd */
  start: string;
  /** ISO yyyy-mm-dd */
  end: string;
  ga4PropertyId?: string;
  gscSiteUrl?: string;
  /** Optional: override API route */
  endpoint?: string; // default /api/insights/compute
};

/**
 * Client-side Insights panel.
 * Fetches from /api/insights/compute with the selected entities + date range.
 */
export function InsightsCards({
  start,
  end,
  ga4PropertyId,
  gscSiteUrl,
  endpoint = "/api/insights/compute",
}: Props) {
  const [items, setItems] = React.useState<InsightCard[] | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | undefined>();

  const canQuery = Boolean(start && end && (ga4PropertyId || gscSiteUrl));

  React.useEffect(() => {
    let alive = true;
    if (!canQuery) {
      setItems(null);
      setLoading(false);
      setError(undefined);
      return;
    }

    setLoading(true);
    setError(undefined);

    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ga4PropertyId,
        gscSiteUrl,
        start,
        end,
      }),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        if (!alive) return;
        // Accept both {items:[...]} and raw array
        const arr: InsightCard[] = Array.isArray(json) ? json : json?.items ?? [];
        setItems(arr);
      })
      .catch((e: any) => {
        if (!alive) return;
        setError(e?.message || "Failed to load insights");
        setItems([]);
      })
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [start, end, ga4PropertyId, gscSiteUrl, endpoint, canQuery]);

  if (!canQuery) {
    return (
      <div className="text-sm text-gray-500">
        Select at least one source (GA4 or GSC) and a date range to see insights.
      </div>
    );
  }

  if (loading) return <div className="text-sm text-gray-500">Computing insights…</div>;
  if (error) return <div className="text-sm text-red-600">Error: {error}</div>;
  if (!items || items.length === 0) {
    return <div className="text-sm text-gray-500">No insights for this period.</div>;
  }

  return (
    <div className="space-y-3">
      {items.map((it, i) => (
        <article
          key={it.id ?? i}
          className={`border rounded-lg p-3 text-sm ${
            it.severity === "action"
              ? "border-emerald-500/40 bg-emerald-50"
              : it.severity === "warn"
              ? "border-amber-500/40 bg-amber-50"
              : "border-gray-200 bg-white"
          }`}
        >
          <header className="flex items-center justify-between mb-1">
            <span className="font-medium">{labelForType(it.type)}</span>
            <span className="px-2 py-0.5 rounded text-xs border">
              {it.severity.toUpperCase()}
            </span>
          </header>

          {/* Try to render common payloads nicely; otherwise stringify */}
          <div className="text-gray-700">
            {renderPayload(it)}
          </div>
        </article>
      ))}
    </div>
  );
}

function labelForType(t: InsightType) {
  switch (t) {
    case "TOP_COVERAGE":
      return "Coverage (Top 3 / 10 / 50)";
    case "MOVER":
      return "Big Movers";
    case "GEO_GAP":
      return "Geo Coverage Gaps";
    case "CRO_OPPORTUNITY":
      return "CRO Opportunities";
    default:
      return t.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());
  }
}

function renderPayload(it: InsightCard) {
  const p = it.payload ?? {};

  // Coverage payload example: { top3: number, top10: number, top50: number, delta?: {...} }
  if (it.type === "TOP_COVERAGE") {
    const top3 = p.top3 ?? 0;
    const top10 = p.top10 ?? 0;
    const top50 = p.top50 ?? 0;
    return (
      <div className="space-y-1">
        <div>Top 3: <strong>{top3}</strong></div>
        <div>Top 10: <strong>{top10}</strong></div>
        <div>Top 50: <strong>{top50}</strong></div>
        {p.delta && (
          <div className="text-xs text-gray-500">
            Δ vs prev: {fmtDelta(p.delta.top3)} / {fmtDelta(p.delta.top10)} / {fmtDelta(p.delta.top50)}
          </div>
        )}
      </div>
    );
  }

  // Movers: { up:[{query, delta}], down:[...] }
  if (it.type === "MOVER") {
    const up: any[] = p.up ?? [];
    const down: any[] = p.down ?? [];
    return (
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="font-medium mb-1">Up</div>
          <ul className="list-disc ml-4 space-y-0.5">
            {up.slice(0, 5).map((m, i) => (
              <li key={i}>{m.query ?? m.page ?? "—"} <span className="text-emerald-700">+{m.delta}</span></li>
            ))}
          </ul>
        </div>
        <div>
          <div className="font-medium mb-1">Down</div>
          <ul className="list-disc ml-4 space-y-0.5">
            {down.slice(0, 5).map((m, i) => (
              <li key={i}>{m.query ?? m.page ?? "—"} <span className="text-rose-700">{m.delta}</span></li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  // Fallback: pretty-print JSON
  return (
    <pre className="text-xs bg-white/50 rounded border border-gray-200 p-2 overflow-auto">
      {safeStringify(p)}
    </pre>
  );
}

function fmtDelta(v: any) {
  if (typeof v !== "number" || !isFinite(v)) return "0";
  const sign = v > 0 ? "+" : "";
  return `${sign}${v}`;
}

function safeStringify(o: any) {
  try {
    return JSON.stringify(o, null, 2);
  } catch {
    return String(o);
  }
}

export default InsightsCards;
