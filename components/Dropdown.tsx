import React from "react";

export type Option = { label: string; value: string };

type Props = {
  label: string;
  options: Option[];
  value?: string;
  onChange: (v: string) => void;
};

export function Dropdown({ label, options, value, onChange }: Props) {
  return (
    <label className="flex items-center gap-2">
      <span className="text-sm">{label}</span>
      <select
        className="border rounded px-2 py-1"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
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
