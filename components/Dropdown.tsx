import * as React from "react";

type Option = { value: string; label: string };
export function Dropdown({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Option[];
  value?: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-neutral-400">{label}</span>
      <select
        className="rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select…</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}
