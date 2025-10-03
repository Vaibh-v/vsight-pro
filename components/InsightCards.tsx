import React from "react";
import { AiPanel } from "@/lib/contracts";

export default function InsightCards({ panel }: { panel: AiPanel }) {
  if (!panel?.items?.length) return <div className="text-sm text-gray-500">No insights yet</div>;
  return (
    <div className="grid gap-3">
      {panel.items.map((it, idx) => (
        <div key={idx} className="p-3 border rounded-lg">
          <div className="font-medium">{it.title}</div>
          <div className="text-sm text-gray-700 mt-1">{it.body}</div>
        </div>
      ))}
    </div>
  );
}
