import * as React from "react";
import { DateRange } from "@/components/DateRange";
import Dropdown from "@/components/Dropdown";

export default function Builder() {
  const [start, setStart] = React.useState("2025-01-01");
  const [end, setEnd] = React.useState("2025-01-31");
  const [ga4, setGa4] = React.useState("");
  const [gsc, setGsc] = React.useState("");
  const [gbp, setGbp] = React.useState("");

  const [dsl, setDsl] = React.useState<any>({ widgets: [{ type: "line", metric: "sessions" }] });

  return (
    <main className="max-w-5xl mx-auto p-4 grid gap-4">
      <h1 className="text-2xl font-semibold">Custom Dashboard Builder</h1>
      <div className="flex flex-wrap gap-3 items-center">
        <DateRange start={start} end={end} onStart={setStart} onEnd={setEnd} />
        <Dropdown label="GA4 Property" value={ga4} onChange={setGa4} source="/api/providers/ga4/resources" />
        <Dropdown label="GSC Site" value={gsc} onChange={setGsc} source="/api/providers/gsc/resources" />
        <Dropdown label="GBP Location" value={gbp} onChange={setGbp} source="/api/providers/gbp/resources" />
      </div>
      <textarea className="border rounded p-2 w-full h-40"
        value={JSON.stringify(dsl, null, 2)}
        onChange={e => { try { setDsl(JSON.parse(e.target.value)); } catch {} }} />
      <div className="text-sm text-gray-600">AI chat to DSL can be wired later (BYO key or WebLLM).</div>
    </main>
  );
}
