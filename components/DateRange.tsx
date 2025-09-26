// components/DateRange.tsx
import * as React from "react";

type Controlled =
  | {
      value: { start: string; end: string };
      onChange: React.Dispatch<React.SetStateAction<{ start: string; end: string }>>;
      start?: never;
      end?: never;
      onStart?: never;
      onEnd?: never;
    }
  | {
      value?: never;
      onChange?: never;
      start: string;
      end: string;
      onStart: (v: string) => void;
      onEnd: (v: string) => void;
    };

type Props = Controlled;

function DateRangeComponent(props: Props) {
  const [local, setLocal] = React.useState<{ start: string; end: string }>(() => {
    if ("value" in props) return props.value;
    return { start: props.start, end: props.end };
  });

  React.useEffect(() => {
    if ("value" in props) setLocal(props.value);
  }, [("value" in props) ? props.value.start : props.start, ("value" in props) ? props.value.end : props.end]);

  const setStart = (v: string) => {
    if ("value" in props) props.onChange((prev) => ({ ...prev, start: v }));
    else props.onStart(v);
    setLocal((p) => ({ ...p, start: v }));
  };
  const setEnd = (v: string) => {
    if ("value" in props) props.onChange((prev) => ({ ...prev, end: v }));
    else props.onEnd(v);
    setLocal((p) => ({ ...p, end: v }));
  };

  return (
    <div className="flex items-center gap-2">
      <input type="date" value={local.start} onChange={(e) => setStart(e.target.value)} className="border rounded px-2 py-1" />
      <span>—</span>
      <input type="date" value={local.end} onChange={(e) => setEnd(e.target.value)} className="border rounded px-2 py-1" />
    </div>
  );
}

export { DateRangeComponent as DateRange };
export default DateRangeComponent;
