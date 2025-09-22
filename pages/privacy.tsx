export default function Privacy() {
  return (
    <main style={{ maxWidth: 800, margin: "40px auto", padding: 16, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Inter, sans-serif" }}>
      <h1>Privacy Policy – VSight Pro</h1>
      <p>Last updated: {new Date().toISOString().slice(0,10)}</p>
      <p>
        VSight Pro displays your own Google Analytics and Search Console data after you sign in with Google.
        We request read-only access to your GA4 properties and verified Search Console sites to show charts in your browser.
        We do not sell or share your data with third parties.
      </p>
      <h2>Data we access</h2>
      <ul>
        <li>Your basic Google profile (email) for authentication.</li>
        <li>Read-only Analytics metrics via the Analytics Data API.</li>
        <li>Read-only Search Console performance data and your verified site list.</li>
      </ul>
      <h2>Storage</h2>
      <p>We do not persist raw Google data on our servers. Queries are executed per session and rendered client-side. Aggregate, non-identifying metrics may be cached to improve performance.</p>
      <h2>Revoking access</h2>
      <p>You may revoke VSight Pro’s access at any time from your Google Account security settings.</p>
      <h2>Contact</h2>
      <p>For privacy questions, email support@digitallycorrupted.co</p>
    </main>
  );
}
