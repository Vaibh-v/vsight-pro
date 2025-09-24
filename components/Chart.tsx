import * as React from "react";

export type SparkPoint = { date: string; value: number };

type SparklineProps = {
  points: SparkPoint[];
  /** Optional: show a simple loading state */
  loading?: boolean;
  /** Optional fixed height */
  height?: number;
};

/**
 * Minimal SVG sparkline.
 * Accepts points as { date, value }[].
 */
export function Sparkline({ points, loading, height = 60 }: SparklineProps) {
  if (loading) return <div className="text-sm text-gray-500">Loading…</div>;

  const w = 400; // viewBox width (responsive via preserveAspectRatio)
  const h = height;
  const n = points.length;

  if (!n) {
    return (
      <div className="text-sm text-gray-500">
        No data in range. Try another date range or select an entity.
      </div>
    );
  }

  const vals = points.map((p) => p.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1; // avoid /0 for flat series

  const x = (i: number) => (n === 1 ? w / 2 : (i / (n - 1)) * w);
  const y = (v: number) => h - ((v - min) / span) * (h - 6) - 3; // 3px padding

  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(2)} ${y(p.value).toFixed(2)}`)
    .join(" ");

  // last point marker
  const lastX = x(n - 1);
  const lastY = y(points[n - 1].value);

  return (
    <div className="w-full">
      <svg
        role="img"
        aria-label="Sparkline"
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        className="w-full h-[60px]"
      >
        {/* baseline */}
        <line x1="0" y1={h - 1} x2={w} y2={h - 1} stroke="currentColor" opacity="0.1" />
        {/* line */}
        <path d={d} fill="none" stroke="currentColor" strokeWidth="2" />
        {/* dot */}
        <circle cx={lastX} cy={lastY} r="2.5" fill="currentColor" />
      </svg>
      <div className="mt-1 text-xs text-gray-500">
        {n} points · min {min.toLocaleString()} · max {max.toLocaleString()}
      </div>
    </div>
  );
}
