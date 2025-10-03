import React from "react";

type Props = {
  start: string;
  end: string;
  onStart: (v: string) => void;
  onEnd: (v: string) => void;
};

export function DateRange({ start, end, onStart, onEnd }: Props) {
  return (
    <div className="flex items-center gap-2">
      <input type="date" value={start} onChange={e => onStart(e.target.value)} className="border rounded px-2 py-1" />
      <span>to</span>
      <input type="date" value={end} onChange={e => onEnd(e.target.value)} className="border rounded px-2 py-1" />
    </div>
  );
}
