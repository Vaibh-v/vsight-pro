import type { DateRange } from "@/lib/google";

export type AlertRule = {
  id: string;
  name: string;
  source: "GA4" | "GSC" | "GBP";
  metric: string;           // e.g. "sessions", "avgPosition"
  condition: "gt" | "lt" | "drops_by_pct" | "rises_by_pct";
  threshold: number;
  windowDays: number;       // lookback
  enabled: boolean;
};

const memoryStore: AlertRule[] = []; // replace with DB later

export function listRules(): AlertRule[] {
  return memoryStore.slice();
}
export function saveRule(rule: AlertRule) {
  const i = memoryStore.findIndex((r) => r.id === rule.id);
  if (i >= 0) memoryStore[i] = rule;
  else memoryStore.push(rule);
}
export function deleteRule(id: string) {
  const i = memoryStore.findIndex((r) => r.id === id);
  if (i >= 0) memoryStore.splice(i, 1);
}

/** Stubbed evaluator: returns empty hits today. */
export async function evaluateRules(_opts: {
  token?: string;
  propertyId?: string;
  siteUrl?: string;
  range: DateRange;
}): Promise<{ triggered: string[] }> {
  // TODO: call GA/GSC and compare vs threshold based on condition/windowDays
  return { triggered: [] };
}
