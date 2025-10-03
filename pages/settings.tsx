import * as React from "react";

export default function Settings() {
  const [serp, setSerp] = React.useState("");
  const [semrush, setSemrush] = React.useState("");
  const [ahrefs, setAhrefs] = React.useState("");
  const [surfer, setSurfer] = React.useState("");
  const [clarity, setClarity] = React.useState("");

  return (
    <main className="max-w-3xl mx-auto p-4 grid gap-3">
      <h1 className="text-2xl font-semibold">Settings (Local Only)</h1>
      <p className="text-sm text-gray-600">These keys are stored in your browser only (localStorage).</p>
      {[
        { label: "SERP API Key", v: serp, s: setSerp, k: "SERP_API_KEY" },
        { label: "SEMrush API Key", v: semrush, s: setSemrush, k: "SEMRUSH_API_KEY" },
        { label: "Ahrefs API Key", v: ahrefs, s: setAhrefs, k: "AHREFS_API_KEY" },
        { label: "Surfer API Key", v: surfer, s: setSurfer, k: "SURFER_API_KEY" },
        { label: "Clarity Project ID", v: clarity, s: setClarity, k: "CLARITY_PROJECT_ID" }
      ].map((row) => (
        <label key={row.k} className="text-sm grid gap-1">
          <span>{row.label}</span>
          <input className="border rounded px-2 py-1" value={row.v} onChange={e => row.s(e.target.value)} />
          <button className="border rounded px-2 py-1 w-max"
            onClick={() => localStorage.setItem(row.k, row.v)}>
            Save
          </button>
        </label>
      ))}
    </main>
  );
}
