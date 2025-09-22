// pages/index.tsx
import { useState, useMemo } from "react";
import type { NextPage } from "next";
import Head from "next/head";
import { signIn, signOut, useSession } from "next-auth/react";

type Json = Record<string, any>;

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

const IndexPage: NextPage = () => {
  const { data: session, status } = useSession();
  const loading = status === "loading";

  // Default to last 7 days
  const { startDefault, endDefault } = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 7);
    return { startDefault: iso(start), endDefault: iso(end) };
  }, []);

  const [propertyId, setPropertyId] = useState<string>("");
  const [siteUrl, setSiteUrl] = useState<string>("");
  const [start, setStart] = useState<string>(startDefault);
  const [end, setEnd] = useState<string>(endDefault);
  const [output, setOutput] = useState<Json | null>(null);
  const [busy, setBusy] = useState(false);
  const authed = !!session;

  async function fetchJson(url: string) {
    setBusy(true);
    setOutput(null);
    try {
      const r = await fetch(url);
      const j = await r.json();
      setOutput(j);
    } catch (e: any) {
      setOutput({ error: e?.message ?? "Request failed" });
    } finally {
      setBusy(false);
    }
  }

  const runGa = () => {
    if (!propertyId) return setOutput({ error: "Enter GA4 propertyId" });
    fetchJson(
      `/api/ga/traffic?propertyId=${encodeURIComponent(
        propertyId
      )}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`
    );
  };

  const runGsc = () => {
    if (!siteUrl) return setOutput({ error: "Enter GSC siteUrl" });
    fetchJson(
      `/api/gsc/keywords?siteUrl=${encodeURIComponent(
        siteUrl
      )}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(
        end
      )}&rowLimit=25`
    );
  };

  const runGbp = () => {
    fetchJson(`/api/gbp/insights`);
  };

  return (
    <>
      <Head>
        <title>VSight Pro — MVP Shell</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-semibold">VSight Pro — MVP Shell</h1>
        <p className="text-sm text-gray-600 mt-1">
          GA traffic · GSC keywords · GBP insights
        </p>

        {/* Auth Card */}
        <section className="mt-6 border rounded-lg p-4">
          <h2 className="font-medium mb-2">Auth</h2>
          {loading ? (
            <p>Loading session…</p>
          ) : authed ? (
            <div className="flex items-center gap-3">
              <span className="text-sm">
                Signed in as{" "}
                <b>{(session?.user as any)?.email ?? session?.user?.name}</b>
              </span>
              <button
                className="px-3 py-1.5 rounded bg-gray-200 hover:bg-gray-300"
                onClick={() => signOut()}
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              className="px-3 py-1.5 rounded bg-black text-white hover:bg-gray-800"
              onClick={() => signIn("google")}
            >
              Sign in with Google
            </button>
          )}
        </section>

        {/* Controls */}
        <section className="mt-6 border rounded-lg p-4">
          <h2 className="font-medium mb-3">Inputs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm text-gray-700">GA4 Property ID</span>
              <input
                className="mt-1 w-full border rounded px-3 py-2"
                placeholder="e.g. 123456789"
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
              />
            </label>

            <label className="block">
              <span className="text-sm text-gray-700">GSC Site URL</span>
              <input
                className="mt-1 w-full border rounded px-3 py-2"
                placeholder="e.g. https://example.com/"
                value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
              />
            </label>

            <label className="block">
              <span className="text-sm text-gray-700">Start</span>
              <input
                type="date"
                className="mt-1 w-full border rounded px-3 py-2"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </label>

            <label className="block">
              <span className="text-sm text-gray-700">End</span>
              <input
                type="date"
                className="mt-1 w-full border rounded px-3 py-2"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </label>
          </div>
        </section>

        {/* Actions + Output */}
        <section className="mt-6 border rounded-lg p-4">
          <h2 className="font-medium mb-3">Test Calls (last 7 days)</h2>

          <div className="flex flex-wrap gap-2 mb-3">
            <button
              onClick={runGa}
              disabled={!authed || busy}
              className="px-3 py-1.5 rounded bg-emerald-600 text-white disabled:opacity-50"
            >
              GA: traffic
            </button>
            <button
              onClick={runGsc}
              disabled={!authed || busy}
              className="px-3 py-1.5 rounded bg-sky-600 text-white disabled:opacity-50"
            >
              GSC: keywords
            </button>
            <button
              onClick={runGbp}
              disabled={busy}
              className="px-3 py-1.5 rounded bg-amber-600 text-white disabled:opacity-50"
            >
              GBP: insights
            </button>
          </div>

          <pre className="min-h-[320px] whitespace-pre-wrap bg-gray-50 border rounded p-3 text-sm overflow-auto">
            {busy
              ? "Loading…"
              : output
              ? JSON.stringify(output, null, 2)
              : "{ }"}
          </pre>
        </section>
      </main>
    </>
  );
};

export default IndexPage;
