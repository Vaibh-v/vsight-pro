import React from "react";

export type InsightCard = { title: string; body?: string; severity?: "info" | "warn" | "action" };

export default function InsightsCards({ items }: { items: InsightCard[] }) {
  if (!items?.length) return <div className="text-xs text-gray-500">No insights yet.</div>;
  return (
    <div className="grid gap-3">
      {items.map((it, i) => (
        <div key={i} className="border rounded p-3">
          <div className="font-medium">{it.title}</div>
          {it.body && <div className="text-sm mt-1">{it.body}</div>}
        </div>
      ))}
    </div>
  );
}
