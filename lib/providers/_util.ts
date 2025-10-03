import { DateRange, MetricPoint } from "@/lib/contracts";

export function genDates(range: DateRange): string[] {
  const out: string[] = [];
  const start = new Date(range.start);
  const end = new Date(range.end);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    out.push(d.toISOString().slice(0,10));
  }
  return out;
}

export function synthSeries(range: DateRange, base = 100, noise = 0.2): MetricPoint[] {
  const days = genDates(range);
  return days.map((date, i) => {
    const v = Math.max(0, Math.round(base * (1 + 0.1 * Math.sin(i/5)) * (1 + (Math.random()-0.5)*noise)));
    return { date, value: v };
  });
}

export function sum(points: MetricPoint[]): number {
  return points.reduce((a, b) => a + b.value, 0);
}
