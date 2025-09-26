import * as React from "react";

export type Option = { label: string; value: string };

type BaseProps = {
  label: string;
  value?: string;
  onChange: (v: string) => void;
};

type PropsWithOptions = BaseProps & {
  options: Option[];
  source?: never;
  map?: never;
};

type PropsWithSource = BaseProps & {
  options?: never;
  source: string; // GET endpoint returning { items: Option[] } or any json + map
  map?: (json: any) => Option[];
};

type Props = PropsWithOptions | PropsWithSource;

export function Dropdown(props: Props) {
  const [opts, setOpts] = React.useState<Option[]>("options" in props ? props.options : []);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    async function load() {
      if (!("source" in props)) return;
      setLoading(true);
      try {
        const r = await fetch(props.source);
        const json = await r.json();
        if (!alive) return;
        if ("map" in props && typeof props.map === "function") {
          setOpts(props.map(json));
        } else if (json && Array.isArray(json.items)) {
          // default shape { items: [{label, value}] }
          setOpts(json.items);
        } else if (Array.isArray(json)) {
          // allow raw arrays
          setOpts(json);
        } else {
          setOpts([]);
        }
      } catch {
        if (alive) setOpts([]);
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [("source" in props) ? props.source : undefined]);

  return (
    <label className="text-sm flex items-center gap-2">
      <span className="whitespace-nowrap">{props.label}</span>
      <select
        className="border rounded p-2 text-sm min-w-[220px]"
        value={props.value ?? ""}
        onChange={(e) => props.onChange(e.target.value)}
        disabled={loading}
      >
        <option value="">{loading ? "Loading..." : "Select..."}</option>
        {opts.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
