import * as React from "react";

export type Option = { value: string; label: string };

type Props =
  | {
      label: string;
      value?: string;
      onChange: (v: string) => void;
      /** Pre-supplied options */
      options: Option[];
      /** If options is provided, source is ignored */
      source?: never;
    }
  | {
      label: string;
      value?: string;
      onChange: (v: string) => void;
      /** Endpoint to fetch options from (GET). Expected shapes are auto-mapped:
       *  - /api/google/ga4/properties -> { items: [{ id, name }] }
       *  - /api/google/gsc/sites      -> { items: [{ siteUrl, permission }] }
       *  You may customize with `map` if your endpoint differs.
       */
      source: string;
      options?: never;
      /** Optional custom mapper from JSON payload to Option[] */
      map?: (json: any) => Option[];
    };

export function Dropdown(props: Props) {
  const [opts, setOpts] = React.useState<Option[]>(
    "options" in props && props.options ? props.options : []
  );
  const [loading, setLoading] = React.useState<boolean>(
    "source" in props && !!props.source
  );
  const [error, setError] = React.useState<string | undefined>();

  // If using source, fetch and map to Option[]
  React.useEffect(() => {
    if (!("source" in props) || !props.source) return;

    let alive = true;
    setLoading(true);
    setError(undefined);

    fetch(props.source)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        if (!alive) return;
        // Custom mapper wins
        if (props.map) {
          setOpts(props.map(json));
          return;
        }
        // Auto-map known shapes
        const items: any[] = json?.items ?? [];
        if (Array.isArray(items) && items.length) {
          // GA4 properties: {id,name}
          if ("id" in items[0] && "name" in items[0]) {
            setOpts(items.map((p: any) => ({ value: p.id, label: p.name })));
            return;
          }
          // GSC sites: {siteUrl, permission}
          if ("siteUrl" in items[0]) {
            setOpts(
              items.map((s: any) => ({
                value: s.siteUrl,
                label: s.siteUrl,
              }))
            );
            return;
          }
        }
        // Fallback: try to coerce
        const fallback =
          Array.isArray(items) && items.length
            ? items.map((x: any, i: number) => ({
                value: String(x.value ?? x.id ?? x.siteUrl ?? i),
                label: String(x.label ?? x.name ?? x.siteUrl ?? x.value ?? i),
              }))
            : [];
        setOpts(fallback);
      })
      .catch((e: any) => setError(e?.message || "Failed to load options"))
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [("source" in props && props.source) || ""]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    props.onChange(e.target.value || "");
  };

  const value = props.value ?? "";

  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <span>{props.label}</span>
      <select
        className="border rounded px-2 py-1"
        value={value}
        onChange={handleChange}
        disabled={loading || (!!error && !(opts?.length))}
      >
        <option value="">{loading ? "Loading…" : "Select…"}</option>
        {opts.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <span className="text-red-600 text-xs ml-1">({error})</span>}
    </label>
  );
}

export default Dropdown;
