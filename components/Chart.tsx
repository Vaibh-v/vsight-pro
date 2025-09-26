import React from "react";

// points: [{date, value}]
export function Sparkline({ points }: { points: { date: string; value: number }[] }) {
  // Simple text fallback (no chart lib)
  return (
    <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
      {points.map((p) => `${p.date}: ${p.value}`).join("\n") || "No data"}
    </pre>
  );
}
