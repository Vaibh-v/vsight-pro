import * as React from "react";

export type Option = { label: string; value: string };

export function Dropdown(props: {
  label: string;
  options: Option[];
  value?: string;
  onChange: (v: string) => void;
}) {
  const { label, options, value, onChange } = props;
  return (
    <label style={{ display: "inline-flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 12, color: "#555" }}>{label}</span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", minWidth: 240 }}
      >
        <option value="" disabled>
          Select…
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
