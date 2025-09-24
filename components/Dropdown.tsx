import * as React from "react";

export type Option = { value: string; label: string };

type PropsWithOptions = {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  /** Pre-supplied options */
  options: Option[];
  source?: never;
  map?: never;
};

type PropsWithSource = {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  /** Endpoint to fetch options (GET). Known shapes are auto-mapped:
   *  - { items: [{ id, name }] }   // GA4 properties
   *  - { items: [{ siteUrl, ...}] } // GSC sites
   */
  source: string;
  options?: never;
  /** Optional custom mapper from JSON payload to Option[] */
  map?: (json: any) => Option[];
};

type Props = PropsWithOptions | PropsWithSource;

function hasSource(p: Props): p is PropsWithSource {
  return (p as PropsWithSource).source !== undefined;
}

export function Dropdown(props: Props) {
  const [opts, setOpts] = React.useState<Option[]>(
    !hasSource(props) && props.options ? props.options : []
  );
  const [loading, setLoading] = React.useState<boolean>(hasSource(props));
  const [error, setError] = React.useState<string | undefined>();

  // If using source, fetch and map to Option[]
  React.useEffect(() => {
    if (!hasSource(props)) return;

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
          // GSC sites: {siteUrl,...}
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
        // Fallback coercion
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
  }, [hasSource(props) ? props.source : ""]); // re-run if source URL changes

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
