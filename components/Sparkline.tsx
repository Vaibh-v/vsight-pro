import React from "react";
import { MetricPoint } from "@/lib/contracts";

export default function Sparkline({ points }: { points: MetricPoint[] }) {
  if (!points || points.length === 0) return <div className="text-xs text-gray-500">No data</div>;
  const w = 300, h = 60, pad = 4;
  const xs = points.map((_, i) => i);
  const ys = points.map(p => p.value);
  const min = Math.min(...ys), max = Math.max(...ys);
  const toX = (i: number) => pad + (i * (w - 2*pad)) / Math.max(1, xs.length - 1);
  const toY = (v: number) => h - pad - ((v - min) * (h - 2*pad)) / Math.max(1, max - min);
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(p.value)}`).join(" ");
  return <svg width={w} height={h}><path d={d} fill="none" stroke="currentColor" /></svg>;
}
