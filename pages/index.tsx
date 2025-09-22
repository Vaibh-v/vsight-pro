// pages/index.tsx
import React, { useEffect, useMemo, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";

type GaProperty = { propertyId: string; displayName: string; account: string };
type GscSite = { siteUrl: string; permissionLevel: string };

export default function Home() {
  const { data: session, status } = useSession();
  const loading = status === "loading";

  const [gaProps, setGaProps] = useState<GaProperty[]>([]);
  const [gscSites, setGscSites] = useState<GscSite[]>([]);
  const [gaPropertyId, setGaPropertyId] = useState<string>("");
  const [gscSiteUrl, setGscSiteUrl] = useState<string>("");

  const [start, setStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [end, setEnd] = useState<string>(() => new Date().toISOString().slice(0, 10));

  const [active, setActive] = useState<"ga" | "gsc" | "gbp" | null>(null);
  const [output, setOutput] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  // Load dropdown data after auth
  useEffect(() => {
    if (!session) return;

    (async () => {
      try {
        const [ga, gsc] = await Promise.all([
          fetch("/api/google/ga4/properties").then((r) => r.json()),
          fetch("/api/google/gsc/sites").then((r) => r.json()),
        ]);

        if (Array.isArray(ga?.properties)) {
          setGaProps(ga.properties);
          if (ga.properties[0]?.propertyId) setGaPropertyId(ga.properties[0].propertyId);
        }
        if (Array.isArray(gsc?.sites)) {
          setGscSites(gsc.sites);
          if (gsc.sites[0]?.siteUrl) setGscSiteUrl(gsc.sites[0].siteUrl);
        }
      } catch (e) {
        console.error("Failed to load dropdown data", e);
      }
    })();
  }, [session]);

  const handleGa = async () => {
    if (!gaPropertyId) return;
    setBusy(true);
    setActive("ga");
    try {
      const res = await fetch(
        `/api/google/ga4/timeseries?propertyId=${encodeURIComponent(
          gaPropertyId
        )}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`
      );
      setOutput(await res.json());
    } finally {
      setBusy(false);
    }
  };

  const handleGsc = async () => {
    if (!gscSiteUrl) return;
    setBusy(true);
    setActive("gsc");
    try {
      const res = await fetch(`/api/google/gsc/top-queries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteUrl: gscSiteUrl, start, end, limit: 25 }),
      });
      setOutput(await res.json());
    } finally {
      setBusy(false);
    }
  };

  const handleGbp = async () => {
    setBusy(true);
    setActive("gbp");
    try {
      const res = await fetch(`/api/google/gbp/insights?start=${start}&end=${end}`);
      setOutput(await res.json());
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold">VSight Pro — MVP Shell</h1>
      <p className="text-sm mt-1 text-gray-600">
        GA traffic · GSC keywords · GBP insights (GBP is stubbed until approval)
      </p>

      <section className="mt-6 border rounded p-4">
        <h2 className="font-medium mb-3">Auth</h2>
        {loading ? (
          <p>Loading session…</p>
        ) : session ? (
          <div className="flex items-center gap-2">
            <span className="text-sm">
              Signed in as <strong>{session.user?.email}</strong>
            </span>
            <button className="px-2 py-1 border rounded" onClick={() => signOut()}>
              Sign out
            </button>
          </div>
        ) : (
          <button className="px-3 py-1 border rounded" onClick={() => signIn("google")}>
            Sign in with Google
          </button>
        )}
      </section>

      <section className="mt-6 border rounded p-4">
        <h2 className="font-medium mb-4">Inputs</h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm block mb-1">GA4 Property</label>
            <select
              className="w-full border rounded p-2"
              value={gaPropertyId}
              onChange={(e) => setGaPropertyId(e.target.value)}
              disabled={!session || gaProps.length === 0}
            >
              {gaProps.map((p) => (
                <option key={p.propertyId} value={p.propertyId}>
                  {p.displayName} ({p.propertyId})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm block mb-1">GSC Site</label>
            <select
              className="w-full border rounded p-2"
              value={gscSiteUrl}
              onChange={(e) => setGscSiteUrl(e.target.value)}
              disabled={!session || gscSites.length === 0}
            >
              {gscSites.map((s) => (
                <option key={s.siteUrl} value={s.siteUrl}>
                  {s.siteUrl}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm block mb-1">Start</label>
            <input
              type="date"
              className="w-full border rounded p-2"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm block mb-1">End</label>
            <input
              type="date"
              className="w-full border rounded p-2"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="mt-6 border rounded p-4">
        <h2 className="font-medium mb-3">Test Calls (last 7 days)</h2>
        <div className="flex gap-2 mb-3">
          <button className="px-3 py-1 rounded border" onClick={handleGa} disabled={!session || busy}>
            GA: traffic
          </button>
          <button className="px-3 py-1 rounded border" onClick={handleGsc} disabled={!session || busy}>
            GSC: keywords
          </button>
          <button className="px-3 py-1 rounded border" onClick={handleGbp} disabled={!session || busy}>
            GBP: insights
          </button>
        </div>

        <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(output ?? {}, null, 2)}</pre>
      </section>
    </main>
  );
}
