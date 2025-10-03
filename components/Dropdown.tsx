import React from "react";

export type Option = { label: string; value: string };

type Props = {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  options?: Option[];
  source?: string;             // if provided, we fetch { items: Option[] }
};

export default function Dropdown(props: Props) {
  const [opts, setOpts] = React.useState<Option[]>(props.options || []);
  React.useEffect(() => {
    let alive = true;
    async function run() {
      if (!props.source) return;
      const r = await fetch(props.source);
      const json = await r.json();
      if (!alive) return;
      setOpts(json.items || []);
    }
    run();
    return () => { alive = false; }
  }, [props.source]);

  return (
    <label className="block text-sm">
      <span className="mr-2">{props.label}</span>
      <select
        className="border rounded px-2 py-1"
        value={props.value || ""}
        onChange={(e) => props.onChange(e.target.value)}
      >
        <option value="">Select…</option>
        {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}
