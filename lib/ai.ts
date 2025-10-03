import { AiPanel, InsightCard, DashboardPayload } from "@/lib/contracts";

/** Simple, zero-cost heuristic insights (works without keys) */
export function heuristicInsights(data: DashboardPayload): AiPanel {
  const items: InsightCard[] = [];
  const { kpis, timeseries } = data;

  if (kpis.sessionsTotal && kpis.sessionsTotal > 0) {
    items.push({
      title: "Traffic overview",
      body: `Total sessions: ${kpis.sessionsTotal.toLocaleString()}.`,
      severity: "info"
    });
  }
  if (kpis.impressionsTotal && kpis.clicksTotal) {
    const ctr = (kpis.clicksTotal / Math.max(1, kpis.impressionsTotal)) * 100;
    items.push({
      title: "Search CTR",
      body: `GSC CTR is ${ctr.toFixed(2)}% across the selected range.`,
      severity: ctr > 3 ? "good" : "info"
    });
  }
  if ((timeseries.views?.at(-1)?.value || 0) > (timeseries.views?.[0]?.value || 0)) {
    items.push({
      title: "GBP views trending up",
      body: "Your GBP views increased over the selected range.",
      severity: "good"
    });
  }
  if (items.length === 0) {
    items.push({ title: "No signals yet", body: "Connect a provider to see insights.", severity: "info" });
  }
  return { items };
}
