import * as React from "react";

export function Sparkline({ points }: { points: Array<{ date: string; value: number }> }) {
  if (!points?.length) return <div style={{ height: 80, color: "#888" }}>No data</div>;

  const w = 560;
  const h = 100;
  const pad = 8;
  const xs = points.map((_, i) => i);
  const ys = points.map((p) => p.value);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanY = maxY - minY || 1;
  const maxX = xs.length - 1 || 1;

  const path = xs
    .map((x, idx) => {
      const px = pad + (x / maxX) * (w - pad * 2);
      const py = pad + (1 - (ys[idx] - minY) / spanY) * (h - pad * 2);
      return `${idx === 0 ? "M" : "L"}${px},${py}`;
    })
    .join(" ");

  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <path d={path} fill="none" stroke="#0ea5e9" strokeWidth={2} />
    </svg>
  );
}
