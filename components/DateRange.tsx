import * as React from "react";

export function DateRange({
  start, end, onStart, onEnd,
}: { start: string; end: string; onStart: (v:string)=>void; onEnd:(v:string)=>void; }) {
  return (
    <div className="flex items-end gap-3">
      <label className="flex flex-col text-sm">
        <span className="text-neutral-400 mb-1">Start</span>
        <input type="date" value={start} onChange={e=>onStart(e.target.value)}
          className="rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2"/>
      </label>
      <label className="flex flex-col text-sm">
        <span className="text-neutral-400 mb-1">End</span>
        <input type="date" value={end} onChange={e=>onEnd(e.target.value)}
          className="rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2"/>
      </label>
    </div>
  );
}
