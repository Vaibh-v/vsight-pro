import * as React from "react";

export type SparkPoint = { date: string; value: number };

export function Sparkline({ points, loading = false }: { points: SparkPoint[]; loading?: boolean }) {
  // Minimal, dependency-free fallback render. You can wire a real chart later.
  if (loading) {
    return <div className="w-full h-24 animate-pulse bg-gray-100 rounded" />;
  }
  const total = points.reduce((s, p) => s + (Number.isFinite(p.value) ? p.value : 0), 0);
  return (
    <div className="w-full border rounded p-3 text-sm">
      <div className="mb-1">Total: {total}</div>
      <div className="grid grid-cols-4 gap-2">
        {points.slice(-8).map((p) => (
          <div key={p.date} className="text-[10px] text-gray-600">
            <div className="font-medium">{p.value}</div>
            <div>{p.date}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
