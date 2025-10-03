import React from "react";

export function Kpi({ label, value }: { label: string; value?: number }) {
  return (
    <div className="p-3 border rounded-lg">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-2xl font-semibold">{value?.toLocaleString() ?? "—"}</div>
    </div>
  );
}
