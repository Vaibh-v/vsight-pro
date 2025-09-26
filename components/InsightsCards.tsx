import * as React from "react";

export type InsightCard = {
  title: string;
  body: string;
  severity: "info" | "warn" | "action";
};

export function InsightsCards({ items }: { items: InsightCard[] }) {
  if (!items?.length) return <div style={{ color: "#666" }}>No insights yet.</div>;
  const color = (s: InsightCard["severity"]) =>
    s === "action" ? "#0ea5e9" : s === "warn" ? "#f59e0b" : "#64748b";
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {items.map((it, i) => (
        <div key={i} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 600, color: color(it.severity) }}>{it.title}</div>
          <div style={{ fontSize: 14, marginTop: 6 }}>{it.body}</div>
        </div>
      ))}
    </div>
  );
}
