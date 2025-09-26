// components/Dropdown.tsx
import * as React from "react";
export type Option = { label: string; value: string };

type Props =
  | {
      label: string;
      value?: string;
      onChange: (v: string) => void;
      options: Option[];
      source?: never;
      map?: never;
    }
  | {
      label: string;
      value?: string;
      onChange: (v: string) => void;
      options?: never;
      source: string;
      map?: (json: any) => Option[];
    };

function Dropdown(props: Props) {
  const [opts, setOpts] = React.useState<Option[]>("options" in props ? props.options : []);
  const [loading, setLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    if ("source" in props) {
      let alive = true;
      setLoading(true);
      fetch(props.source, { credentials: "include" })
        .then((r) => r.json())
        .then((json) => {
          if (!alive) return;
          if (props.map) setOpts(props.map(json));
          else if (Array.isArray(json?.items)) setOpts(json.items as Option[]);
          else setOpts([]);
        })
        .catch(() => setOpts([]))
        .finally(() => setLoading(false));
      return () => {
        alive = false;
      };
    }
  }, [("source" in props) ? props.source : ""]);

  return (
    <label className="flex items-center gap-2">
      <span className="text-sm text-gray-600">{props.label}</span>
      <select
        className="border rounded-md px-2 py-1"
        value={props.value ?? ""}
        onChange={(e) => props.onChange(e.target.value)}
        disabled={loading}
      >
        <option value="" disabled>
          {loading ? "Loading..." : "Select..."}
        </option>
        {opts.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
export default Dropdown;
export { Dropdown };
