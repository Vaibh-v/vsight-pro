import * as React from "react";

export function DateRange(props: {
  start: string;
  end: string;
  onStart: (v: string) => void;
  onEnd: (v: string) => void;
}) {
  const { start, end, onStart, onEnd } = props;
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <input type="date" value={start} onChange={(e) => onStart(e.target.value)}
        style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd" }} />
      <span>—</span>
      <input type="date" value={end} onChange={(e) => onEnd(e.target.value)}
        style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd" }} />
    </div>
  );
}
