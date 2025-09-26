// components/InsightsCards.tsx
import * as React from "react";

type InsightCard = { title: string; body?: string; severity?: "low" | "med" | "high" };

type Props =
  | { items: InsightCard[]; start?: never; end?: never; ga4PropertyId?: never; gscSiteUrl?: never }
  | { items?: never; start: string; end: string; ga4PropertyId?: string; gscSiteUrl?: string };

function InsightsCardsComponent(props: Props) {
  const [items, setItems] = React.useState<InsightCard[]>(
    "items" in props && props.items ? props.items : []
  );

  React.useEffect(() => {
    if ("items" in props && props.items) {
      setItems(props.items);
      return;
    }
    setItems([]); // placeholder until insights API is wired
  }, [("items" in props) ? JSON.stringify(props.items) : `${props.start}-${props.end}-${props.ga4PropertyId}-${props.gscSiteUrl}`]);

  if (!items.length) return <div className="text-sm text-gray-500">No insights yet.</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {items.map((it, i) => (
        <div key={i} className="border rounded-xl p-3">
          <div className="text-sm font-medium">{it.title}</div>
          {it.body && <div className="text-sm text-gray-600 mt-1">{it.body}</div>}
        </div>
      ))}
    </div>
  );
}

export { InsightsCardsComponent as InsightsCards };
export default InsightsCardsComponent;
